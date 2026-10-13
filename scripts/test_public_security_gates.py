#!/usr/bin/env python3
"""Exercise real public gates in isolated repositories with synthetic fixtures."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parent

class PublicSecurityGates(unittest.TestCase):
    def gate(self, script, body=b"Public portfolio", filename="index.html", ci=False, symlink=False):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/"scripts").mkdir()
            shutil.copyfile(SOURCE/script,root/"scripts"/script)
            env=dict(os.environ)
            env.pop("EXTRACTION_BASE_SHA",None)
            env.pop("PRIVATE_REF_BASE_SHA",None)
            env["GITHUB_ACTIONS"]="false"
            if ci:
                subprocess.run(["git","init","-q",directory],check=True)
                subprocess.run(["git","add","."],cwd=root,check=True)
                subprocess.run(["git","-c","user.name=Gate fixture","-c","user.email=fixture@example.invalid","commit","-qm","baseline"],cwd=root,check=True)
                sha=subprocess.check_output(["git","rev-parse","HEAD"],cwd=root,text=True).strip()
                env.update(GITHUB_ACTIONS="true",EXTRACTION_BASE_SHA=sha,PRIVATE_REF_BASE_SHA=sha)
            (root/filename).parent.mkdir(parents=True,exist_ok=True)
            if symlink:(root/filename).symlink_to(body.decode())
            else:(root/filename).write_bytes(body)
            return subprocess.run([sys.executable,str(root/"scripts"/script)],cwd=root,env=env,capture_output=True,text=True)

    def tokens(self):
        return [
            ("OpenAI API key","sk"+"-"+"A"*32),
            ("OpenAI API key","sk"+"-proj-"+"B"*48),
            ("OpenAI API key","sk"+"-svcacct-"+"C"*48),
            ("Google API key","AI"+"za"+"D"*35),
            ("AWS access key","AS"+"IA"+"E"*16),
            ("GitHub token","gh"+"p_"+"F"*36),
            ("GitHub fine-grained token","github"+"_pat_"+"G"*40),
        ]

    def test_provider_families_and_json_encodings(self):
        for label,token in self.tokens():
            escaped="".join("\\u%04x"%ord(c) for c in token)
            for representation in (token,escaped,json.dumps(escaped),json.dumps(json.dumps(escaped))):
                with self.subTest(label=label,encoding=len(representation)):
                    result=self.gate("audit_public_exposure.py",representation.encode())
                    self.assertNotEqual(result.returncode,0)
                    self.assertIn(label,result.stdout)
                    self.assertNotIn(token,result.stdout+result.stderr)

    def test_chunk_boundary(self):
        for label,token in self.tokens():
            body=b"x"*(1024*1024-10)+b" "+token.encode()+b" "
            result=self.gate("audit_public_exposure.py",body)
            self.assertNotEqual(result.returncode,0)
            self.assertIn(label,result.stdout)

    def test_encoded_chunk_boundary_and_surrogates(self):
        token=self.tokens()[1][1]
        encoded="".join("\\u%04x"%ord(c) for c in token).encode()
        result=self.gate("audit_public_exposure.py",b" "*(1024*1024-50)+encoded)
        self.assertNotEqual(result.returncode,0)
        self.assertIn("OpenAI API key",result.stdout)
        result=self.gate("audit_public_exposure.py",b"Unrelated escaped text: \\ud800")
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def test_deeply_encoded_fixed_length_key_across_boundary(self):
        token=self.tokens()[3][1]
        encoded="".join("\\u%04x"%ord(c) for c in token)
        for _ in range(7):
            encoded=json.dumps(encoded)
        # Split near the end, retaining a prefix larger than the former overlap.
        cut=len(encoded)-600
        self.assertGreater(cut,4096)
        body=b" "*(1024*1024-cut)+encoded.encode()
        result=self.gate("audit_public_exposure.py",body)
        self.assertNotEqual(result.returncode,0)
        self.assertIn("Google API key",result.stdout)

    def test_binary_asset_appended_credential(self):
        token=self.tokens()[1][1]
        result=self.gate("audit_public_exposure.py",b"\x89PNG\r\n\x1a\n"+b" "+token.encode(),"image.png")
        self.assertNotEqual(result.returncode,0)
        self.assertIn("OpenAI API key",result.stdout)

    def test_safe_content_and_ci_baseline(self):
        for ci in (False,True):
            result=self.gate("audit_public_exposure.py",b"Fictional planning; OpenAI configured; no credential value.",ci=ci)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def test_ci_without_baseline_denies(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/"scripts").mkdir()
            shutil.copyfile(SOURCE/"audit_public_exposure.py",root/"scripts/audit_public_exposure.py")
            env=dict(os.environ,GITHUB_ACTIONS="true",EXTRACTION_BASE_SHA="not-a-commit")
            result=subprocess.run([sys.executable,str(root/"scripts/audit_public_exposure.py")],env=env,capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn("baseline could not be resolved",result.stdout)

    def test_missing_private_repository_families(self):
        fragments=(("iaap-","guard-core"),("composite-ai-infrastructure-","product-poc"),("multicloud-","foundation-product-poc"))
        for pieces in fragments:
            name="".join(pieces)
            for representation in (name, name+".git", "git@github.com:InfrastructureProductWorks/"+name+".git", "".join("\\u%04x"%ord(c) for c in name)):
                result=self.gate("audit_private_references.py",representation.encode(),ci=True)
                self.assertNotEqual(result.returncode,0)
                self.assertIn("new private/internal implementation reference",result.stdout)

    def test_credentials_in_published_paths(self):
        for label,token in self.tokens():
            escaped="".join("\\u%04x"%ord(c) for c in token[:8])+token[8:]
            percent="".join("%%%02X"%ord(c) for c in token)
            for name in (token+".html",token+"/index.html",escaped+".html",percent+".html","backup-"+token+".html","backup-"+token+"-copy.html"):
                result=self.gate("audit_public_exposure.py",filename=name)
                self.assertNotEqual(result.returncode,0)
                self.assertIn(label,result.stdout)
                self.assertNotIn(token,result.stdout+result.stderr)

    def test_private_references_in_published_paths_including_binary(self):
        name="".join(("iaap-","guard-core"))
        percent="".join("%%%02X"%ord(c) for c in name)
        for filename in (name+"/index.html",name+".html",percent+"/image.png",name+".min.html","backup-"+name+".min.html",name+"-copy/image.png"):
            result=self.gate("audit_private_references.py",body=b"\x00",filename=filename,ci=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn("published path",result.stdout)

    def test_credential_families_with_content_affixes(self):
        for label,token in self.tokens():
            result=self.gate("audit_public_exposure.py",("backup-"+token+"-copy").encode())
            self.assertNotEqual(result.returncode,0)
            self.assertIn(label,result.stdout)
            self.assertNotIn(token,result.stdout+result.stderr)

    def test_new_repository_name_requires_public_allowlist(self):
        coordinate="".join(("InfrastructureProductWorks/","private-producer"))
        for value in (coordinate, "https://github.com/"+coordinate.replace("/","\\"), "https://github.com/"+"".join(("InfrastructureProductWorks/","iaap-guard/../","private-","producer"))):
            result=self.gate("audit_private_references.py",value.encode(),ci=True)
            self.assertNotEqual(result.returncode,0)

    def test_unknown_coordinates_in_paths_and_other_namespaces(self):
        name="".join(("InfrastructureProductWorks/","private-producer/","index.html"))
        result=self.gate("audit_private_references.py",filename=name,ci=True)
        self.assertNotEqual(result.returncode,0)
        for coordinate in ("".join(("SAABOLImpactVenture/","iaap-guard")), "https://github.com/"+"".join(("PrivatePartner/","secret-repo")), "https://github.com./"+"".join(("PrivatePartner/","secret-repo")), "ssh://git@ssh.github.com:443/"+"".join(("PrivatePartner/","secret-repo.git")), "".join(("https://github.com/","apps/../","PrivatePartner/","secret-repo"))):
            result=self.gate("audit_private_references.py",coordinate.encode(),ci=True)
            self.assertNotEqual(result.returncode,0)

    def test_symlink_target_does_not_bypass_either_gate(self):
        for script in ["audit_private_references.py","audit_public_exposure.py"]:
            result=self.gate(script,b"unavailable-target",ci=True,symlink=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn("Symbolic-link",result.stdout)

    def test_opaque_publication_formats_are_rejected(self):
        module=b'[submodule "engine"]\n url = ../private-source\n'
        pointer=b'version https://'+b'git-lfs.github.com'+b'/spec/v1\noid sha256:'+b'a'*64+b'\nsize 100\n'
        for name,body in [('.gitmodules',module),('hidden.md',pointer)]:
            result=self.gate('audit_private_references.py',body=body,filename=name,ci=True)
            self.assertNotEqual(result.returncode,0)

    def test_over_encoded_coordinates_fail_closed(self):
        from urllib.parse import quote
        text='https://github.com/'+''.join(('PrivatePartner/','secret-repo'))
        for _ in range(9):text=quote(text,safe='')
        result=self.gate('audit_private_references.py',text.encode(),ci=True)
        self.assertNotEqual(result.returncode,0)

    def test_bom_marked_coordinates_are_scanned(self):
        text='https://github.com/'+''.join(('PrivatePartner/','secret-repo'))
        for encoding in ['utf-16','utf-32','utf-8-sig']:
            result=self.gate('audit_private_references.py',text.encode(encoding),ci=True)
            self.assertNotEqual(result.returncode,0)

    def test_public_product_names_still_allowed(self):
        result=self.gate("audit_private_references.py",b"Forge, Guard, Console, Assurance, Composite AI, Northstar Signal",ci=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

if __name__=="__main__":
    unittest.main()
