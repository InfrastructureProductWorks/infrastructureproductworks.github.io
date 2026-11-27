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
    def test_app_url_suffixes_and_markup_boundaries(self):
        app='https://github.com/'+'apps/'+'iaap-guard'
        for body in [app, '<a href="'+app+'">App</a>', '[App]('+app+')', '<'+app+'>', json.dumps({'app':app})]:
            result=self.gate('audit_private_references.py',body.encode(),ci=True)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        for suffix in [';private','@private','!private',':private','%3Bprivate','/','?q=private','#private','%22private','%29private','%3Eprivate']:
            for body in [app+suffix, '<a href="'+app+suffix+'">App</a>']:
                with self.subTest(body=body):
                    result=self.gate('audit_private_references.py',body.encode(),ci=True)
                    self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
        for suffix in ['\"private',"'private",')private','>private',']private']:
            result=self.gate('audit_private_references.py',(app+suffix).encode(),ci=True)
            self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
        for suffix in [')private','>private',']private',' private']:
            result=self.gate('audit_private_references.py',('<a href="'+app+suffix+'">App</a>').encode(),ci=True)
            self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)

    def test_public_route_encoded_whitespace_and_suffixes(self):
        repo='/'.join(('InfrastructureProductWorks','iaap-guard'))
        routes=['https://github.com/'+repo, 'https://github.com/'+repo+'/issues/12', 'https://github.com/'+repo+'/blob/main/file', 'https://raw.githubusercontent.com/'+repo+'/main/file', 'https://github.com/'+'apps/'+'iaap-guard']
        for route in routes:
            for body in [route, '<a href="'+route+'">Public</a>', '[Public]('+route+')', '<'+route+'>', json.dumps({'url':route})]:
                result=self.gate('audit_private_references.py',body.encode(),ci=True)
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)
            for space in ['%09','%0A','%0D','%2509','&#9;','%20','%2520','&#32;','&amp;#32;',r'\u0020','%C2%A0','&#160;']:
                for tail in ['/private','']:
                    for body in [route+space+tail, '<a href="'+route+space+tail+'">Public</a>']:
                        with self.subTest(body=body):
                            result=self.gate('audit_private_references.py',body.encode(),ci=True)
                            self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
    def test_exact_source_paths_and_control_suffixes(self):
        script=SOURCE/'audit_private_references.py'
        namespace={'__file__':str(script)}
        exec(script.read_text().split('base=baseline_ref()')[0],namespace)
        count=namespace['reference_counts']
        web=namespace['PUBLIC_SOURCE_WEB_PATHS']
        raw=namespace['PUBLIC_SOURCE_RAW_PATHS']
        self.assertEqual(len(web),8)
        self.assertEqual(len(raw),2)
        for host,paths in [('github.com/',web),('raw.githubusercontent.com/',raw)]:
            for path in paths:
                route='https://'+host+path
                for body in [route,'<a href="'+route+'">Public</a>','[Public]('+route+')']:
                    self.assertFalse(count(body),body)
                for suffix in ['/extra','?private','#private','%20/private','&#1;','%7F',r'\u0007']:
                    self.assertTrue(count(route+suffix),route+suffix)
                wrong=('raw.githubusercontent.com/' if host=='github.com/' else 'github.com/')+path
                self.assertTrue(count('https://'+wrong),wrong)
        private='/'.join(('PrivatePartner','secret-repo'))
        for letter in [r'\u005cu0067',r'\u005cx67',r'\x5cu0067',r'\x5cx67']:
            self.assertTrue(count('https://'+letter+'ithub.com/'+private),letter)
            self.assertTrue(count('https://'+letter+'ithub.com/'+'apps/'+'iaap-guard%20/private'),letter)
        repo='/'.join(('InfrastructureProductWorks','iaap-guard'))
        for suffix in ['/PrivatePartner/secret-repo','/tree/main/file','/blob/topic/file','/issues/1/extra','?private',';private']:
            self.assertTrue(count('https://github.com/'+repo+suffix),suffix)
        for code in [*range(32),*range(127,160),*range(0xfdd0,0xfdf0),*(plane*65536+tail for plane in range(17) for tail in (65534,65535))]:
            for encoding in ['&#'+str(code)+';','&#x'+format(code,'x')+';',r'\u'+format(code,'04x')]:
                for route in ['https://github.com/'+repo,'https://github.com/'+'apps/'+'iaap-guard']:
                    self.assertTrue(count(route+encoding),route+encoding)
                    self.assertTrue(count(route+encoding+'/private'),route+encoding)
                    if not namespace['html'].unescape(encoding):
                        for position in [route.index('github')+3,route.index('iaap')+2]:
                            altered=route[:position]+encoding+route[position:]
                            self.assertTrue(count(altered),altered)

    def test_rendered_markup_and_invisible_coordinates(self):
        script=SOURCE/'audit_private_references.py'
        namespace={'__file__':str(script)}
        exec(script.read_text().split('base=baseline_ref()')[0],namespace)
        count=namespace['reference_counts']
        for marker in ['<wbr>','<!-- -->','<span></span>','**','~~','`']:
            value='https://github.com/'+'PrivatePartner/'+marker+'secret-repo'
            self.assertTrue(count(value),value)
            self.assertTrue(count('<p>'+value+'</p>'),value)
        for encoded in ['&lt;wbr&gt;','%3Cwbr%3E','%253Cwbr%253E']:
            self.assertTrue(count('https://github.com/'+'PrivatePartner/'+encoded+'secret-repo'),encoded)
        chars=namespace['DEFAULT_IGNORABLE'].findall(''.join(map(chr,range(0x110000))))
        self.assertEqual(len(chars),4174)
        for char in chars:
            value='https://github.com/'+'PrivatePartner/'+char+'secret-repo'
            self.assertTrue(count(value),repr(value))
        host='https://'+'.'.join(('github','com'))+'/'
        for value in [
            host+'[PrivatePartner](https://example.com)/secret-repo',
            host+'Private[Partner](https://example.com)/secret-repo',
            ''.join(('iaap-','__forge__')),''.join(('iaap-','_forge_')),
            host+r'PrivatePartner/\udb40\udc00secret-repo',
            host+r'PrivatePartner/\udb40\udd00secret-repo',
            host+'[PrivatePartner][link]/secret-repo\n\n[link]: https://example.com',
            host+'[PrivatePartner][]/secret-repo\n\n[PrivatePartner]: https://example.com',
            host+'[PrivatePartner]/secret-repo\n\n[PrivatePartner]: https://example.com',
        ]:self.assertTrue(count(value),value)
        for name in namespace['PRIVATE_NAMES']:
            for prefix in ['', 'prefix-', 'before_', 'alpha.']:
                for suffix in ['', '-suffix', '_after', '.git']:
                    value=prefix+name+suffix
                    for encoded in [value,value.upper(),''.join('&#'+str(ord(c))+';' for c in value),''.join('%'+format(ord(c),'02x') for c in value)]:
                        self.assertTrue(count(encoded),encoded)
                        self.assertTrue(namespace['path_reference_counts'](encoded+'/index.html'),encoded)
                        for wrapped in ['<div data-evidence="'+encoded+'">Public</div>', '{"'+encoded+'":"Public"}']:
                            self.assertTrue(count(wrapped),wrapped)
        for depth in range(1,19):
            value=''.join(('iaap-','_'*depth,'forge','_'*depth))
            try:found=count(value)
            except ValueError:found=True
            self.assertTrue(found,value)
        public='https://github.com/'+'/'.join(('InfrastructureProductWorks','iaap-guard'))
        for value in ['<b>Public</b> documentation', '[Public]('+public+')', '<a href="'+public+'">Public</a>', '**Public** documentation',public]:
            self.assertFalse(count(value),value)

    def test_public_protocol_lexical_contexts_only(self):
        script=SOURCE/'audit_private_references.py'
        namespace={'__file__':str(script)}
        exec(script.read_text().split('base=baseline_ref()')[0],namespace)
        # Test the lexical recognizer separately; production also requires immutable bytes.
        count=lambda text:namespace['reference_counts'](namespace['public_name_scan_text'](text))
        schemas=namespace['PUBLIC_SCHEMA_VALUES'];downloads=namespace['PUBLIC_DOWNLOAD_VALUES']
        for token in (*schemas,*downloads):
            for template in ['`{}`','<code>{}</code>']:
                good=template.format(token)
                self.assertFalse(count(good),good)
                self.assertFalse(count(good+'. Sentence.'),good)
                self.assertTrue(count(good+'.suffix'),good)
                for bad in [template.format(token+'-suffix'),'prefix-'+good,good+'-suffix',template.format('prefix-'+token)]:
                    self.assertTrue(count(bad),bad)
            for bad in [token,'Public '+token+' prose','{"'+token+'":"public"}', '"'+token+'"']:
                self.assertTrue(count(bad),bad)
        for token in schemas:
            for prefix in ['{schemaVersion:', '{"schemaVersion":', 'const records=data?.schemaVersion===', 'if record.get("schemaVersion")!=']:
                good=prefix+'"'+token+'"';self.assertFalse(count(good),good)
                for bad in [prefix+'"'+token+'-suffix"',prefix+'"'+token.replace('/v','/v9')+'"',prefix+'"'+token+'\n-suffix"']:
                    self.assertTrue(count(bad),bad)
            for suffix in ['/*join*/+"-suffix"','["slice"](0,14)','\n/*join*/+"-suffix"']:
                self.assertTrue(count('{schemaVersion:"'+token+'"'+suffix))
            for bad in ['Public prose schemaVersion:"'+token+'"', '<a href=\'https://example.com/#schemaVersion:"'+token+'"\'>x</a>', 'prefix&#45;<code>'+token+'</code>', '<code>'+token+'</code>&#45;suffix', 'prefix-<span></span><code>'+token+'</code>']:
                self.assertTrue(count(bad),bad)
            for bad in ['schemaVersion:\n"'+token+'"','schemaVersion:"'+token+"'", 'schemaVersion:"'+token+'"+"-suffix"']:
                self.assertTrue(count(bad),bad)
            for bad in ['<div data-x="<code>'+token+'</code>">x</div>', 'const x="prefix-"+`'+token+'`;', '`'+token+'`/*x*/+"-suffix"', '`'+token+'` /*x*/ + "-suffix"', '`'+token+'` ["slice"](0,14)', '`'+token+'` .concat("-suffix")', 'const x = `'+token+'`;']:
                self.assertTrue(count(bad),bad)
        for token in downloads:
            good='link.download="'+token+'"';self.assertFalse(count(good),good)
            self.assertTrue(count('arbitrary="'+token+'"'))
        template=namespace['PUBLIC_DOWNLOAD_TEMPLATE']
        self.assertFalse(count('link.download=`'+template+'`;'))
        for bad in ['arbitrary=`'+template+'`','link.download=`'+template+'-suffix`','link.download=`'+template.replace('activeOrder','other')+'`']:
            self.assertTrue(count(bad),bad)
        url=namespace['PUBLIC_PREVIEW_URL']
        for good in ['<a href="'+url+'">Preview</a>','[Preview]('+url+')',repr(url)]:
            self.assertFalse(count(good),good)
            self.assertTrue(count(good+' https://github.com/'+''.join(('PrivatePartner/','secret-repo'))))
        for operator in ['+','%2B',r'\u002b',r'\x2b','&#43;']:
            self.assertTrue(count('const x="prefix-"'+operator+'"'+url+'";'))
        for bad in [url,'"'+url+'private"','"'+url.replace('.onrender.com','.example.com')+'"']:
            self.assertTrue(count(bad),bad)

    def test_public_contract_source_digest_binding(self):
        script=SOURCE/'audit_private_references.py'
        namespace={'__file__':str(script)}
        exec(script.read_text().split('base=baseline_ref()')[0],namespace)
        count=namespace['reference_counts'];root=SOURCE.parent
        for path,digest in namespace['REVIEWED_PUBLIC_CONTRACT_SOURCES'].items():
            raw=(root/path).read_bytes();body=raw.decode('utf-8')
            self.assertEqual(namespace['hashlib'].sha256(raw).hexdigest(),digest,path)
            self.assertFalse(count(body,source_path=path,source_bytes=raw),path)
            self.assertTrue(count(body),path)
            self.assertTrue(count(body,source_path='other/'+path,source_bytes=raw),path)
            changed=raw+b'\n// changed source requires explicit re-review\n'
            self.assertTrue(count(changed.decode(),source_path=path,source_bytes=changed),path)
            self.assertTrue(count(body+' ',source_path=path,source_bytes=raw),path)
        token=namespace['PUBLIC_SCHEMA_VALUES'][0]
        expressions=[
            'document.body.textContent=({schemaVersion:"'+token+'"}).schemaVersion.slice(0,14)',
            'document.body.textContent=({schemaVersion:"'+token+'"})["schemaVersion"].slice(0,14)',
            'const x={schemaVersion:"'+token+'"};const y=x;document.body.textContent=y.schemaVersion.slice(0,14)',
            'const {schemaVersion:name}={schemaVersion:"'+token+'"};document.body.textContent=name.slice(0,14)',
        ]
        path='assets/assurance-demo.js';raw=(root/path).read_bytes()
        for expression in expressions:
            self.assertTrue(count(expression),expression)
            changed=raw+('\n'+expression+';\n').encode()
            self.assertTrue(count(changed.decode(),source_path=path,source_bytes=changed),expression)

    def test_optional_ssh_username(self):
        for prefix in ['github.com:','alice@github.com:']:
            result=self.gate('audit_private_references.py',(prefix+''.join(('PrivatePartner/','secret-repo.git'))).encode(),ci=True)
            self.assertNotEqual(result.returncode,0)

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
        for encoding in ['utf-16','utf-32','utf-8-sig','utf-16-le','utf-16-be','utf-32-le','utf-32-be']:
            result=self.gate('audit_private_references.py',text.encode(encoding),ci=True)
            self.assertNotEqual(result.returncode,0)

    def test_markdown_escaped_hostname_is_scanned(self):
        text=r'[private](https://github\.com/'+''.join(('PrivatePartner/','secret-repo'))+')'
        result=self.gate('audit_private_references.py',text.encode(),ci=True)
        self.assertNotEqual(result.returncode,0)

    def test_idna_host_separators_are_scanned(self):
        for separator in ['。','．','｡']:
            text='https://github'+separator+'com/'+''.join(('PrivatePartner/','secret-repo'))
            result=self.gate('audit_private_references.py',text.encode(),ci=True)
            self.assertNotEqual(result.returncode,0)

    def test_web_editor_repository_aliases_are_scanned(self):
        for prefix in ['https://github.dev/','https://vscode.dev/github/']:
            text=prefix+''.join(('PrivatePartner/','secret-repo'))
            result=self.gate('audit_private_references.py',text.encode(),ci=True)
            self.assertNotEqual(result.returncode,0)

    def test_url_ignored_controls_are_scanned(self):
        text='<a href="https://git&#x0A;hub.com/'+''.join(('PrivatePartner/','secret-repo'))+'">link</a>'
        result=self.gate('audit_private_references.py',text.encode(),ci=True)
        self.assertNotEqual(result.returncode,0)

    def test_private_prefix_cannot_traverse_into_approved_repository(self):
        public='/'.join(('InfrastructureProductWorks','iaap-guard'))
        private='/'.join(('PrivatePartner','secret-repo'))
        host='.'.join(('github','com'))+'/'
        values=[host+private+'/../../'+public,
                private+'/../../'+public,
                host+public+'/../private-repo/../iaap-guard',
                public+'/./file']
        # Unknown unqualified owners remain outside the legacy whole-file gate;
        # the bounded portfolio consumer separately enforces owner-agnostic text.
        for value in (values[0],values[2],values[3]):
            with self.subTest(value=value):
                result=self.gate('audit_private_references.py',value.encode(),ci=True)
                self.assertNotEqual(result.returncode,0)

    def test_app_ui_allowance_is_exact(self):
        app='.'.join(('github','com'))+'/'+ '/'.join(('apps','iaap-guard'))
        for suffix in ['/extra','.git','/PrivatePartner/secret-repo','/../private-app/../iaap-guard']:
            result=self.gate('audit_private_references.py',(app+suffix).encode(),ci=True)
            self.assertNotEqual(result.returncode,0)
        result=self.gate('audit_private_references.py',app.replace('com/','com:').encode(),ci=True)
        self.assertNotEqual(result.returncode,0)
        for value in (app,'www.'+app):
            result=self.gate('audit_private_references.py',value.encode(),ci=True)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def test_network_github_host_controls_are_scanned(self):
        private='/'.join(('PrivatePartner','secret-repo'))
        for control in ['\t','\n','\r','&#10;','%09',r'\u000a']:
            value='//git'+control+'hub.com/'+private
            result=self.gate('audit_private_references.py',value.encode(),ci=True)
            self.assertNotEqual(result.returncode,0)

    def test_public_product_names_still_allowed(self):
        result=self.gate("audit_private_references.py",b"Forge, Guard, Console, Assurance, Composite AI, Northstar Signal",ci=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def projection_gate(self, assurance, roadmap):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/"scripts").mkdir()
            (root/"assets").mkdir()
            (root/"data").mkdir()
            shutil.copyfile(SOURCE/"audit_public_projections.py",root/"scripts/audit_public_projections.py")
            (root/"assets/assurance-records.json").write_text(json.dumps(assurance),encoding="utf-8")
            (root/"data/roadmap-relationships.json").write_text(json.dumps(roadmap),encoding="utf-8")
            return subprocess.run(
                [sys.executable,str(root/"scripts/audit_public_projections.py")],
                cwd=root,
                capture_output=True,
                text=True,
            )

    def load_projection_module(self):
        import types
        path=SOURCE/"audit_public_projections.py"
        module=types.ModuleType("audit_public_projections")
        module.__file__=str(path)
        exec(compile(path.read_text(encoding="utf-8"),str(path),"exec"),module.__dict__)
        return module

    def load_valid_projections(self):
        root=SOURCE.parent
        assurance=json.loads((root/"assets/assurance-records.json").read_text(encoding="utf-8"))
        roadmap=json.loads((root/"data/roadmap-relationships.json").read_text(encoding="utf-8"))
        return assurance,roadmap

    def test_public_projection_valid_baseline_passes(self):
        assurance,roadmap=self.load_valid_projections()
        result=self.projection_gate(assurance,roadmap)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertIn("Public Projection Contract Gate: PASS",result.stdout)
        module=self.load_projection_module()
        findings=[]
        module.reject_sensitive({"keyResults":["KR1.1"],"headlineKeyResults":["O1-HKR1"],"schemaVersion":"v1"},"$",findings)
        self.assertEqual(findings,[])

    def test_public_projection_rejects_non_list_nested_arrays(self):
        import copy
        assurance,roadmap=self.load_valid_projections()
        top_fields=("objectives","keyResults","headlineKeyResults","progressHistory")
        for field in top_fields:
            for bad_value in ({},"not-a-list",123,None):
                with self.subTest(field=field,bad_type=type(bad_value).__name__):
                    mutated=copy.deepcopy(roadmap)
                    mutated[field]=bad_value
                    result=self.projection_gate(assurance,mutated)
                    self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                    self.assertIn(f"roadmap.{field}: expected array",result.stdout)

        for bad_value in ({},"not-a-list",42,None):
            with self.subTest(field="headlineKeyResults[0].epicContributions",bad_type=type(bad_value).__name__):
                mutated=copy.deepcopy(roadmap)
                mutated["headlineKeyResults"][0]["epicContributions"]=bad_value
                result=self.projection_gate(assurance,mutated)
                self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertIn("roadmap.headlineKeyResults[0].epicContributions: expected array",result.stdout)

        nested_cases=[
            ("objectives",0,"keyResults","roadmap.objectives[0].keyResults: expected array"),
            ("objectives",0,"headlineKeyResults","roadmap.objectives[0].headlineKeyResults: expected array"),
            ("keyResults",0,"epics","roadmap.keyResults[0].epics: expected array"),
            ("headlineKeyResults",0,"measures","roadmap.headlineKeyResults[0].measures: expected array"),
        ]
        for parent,idx,field,expected_msg in nested_cases:
            for bad_value in ({},"scalar",7):
                with self.subTest(path=expected_msg,bad_type=type(bad_value).__name__):
                    mutated=copy.deepcopy(roadmap)
                    mutated[parent][idx][field]=bad_value
                    result=self.projection_gate(assurance,mutated)
                    self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                    self.assertIn(expected_msg,result.stdout)

        first_epic=next(iter(roadmap["epics"]))
        for bad_value in ({},"scalar",7):
            with self.subTest(path=f"epics[{first_epic}].features",bad_type=type(bad_value).__name__):
                mutated=copy.deepcopy(roadmap)
                mutated["epics"][first_epic]["features"]=bad_value
                result=self.projection_gate(assurance,mutated)
                self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertIn(f"roadmap.epics[{first_epic}].features: expected array",result.stdout)

    def test_public_projection_rejects_invalid_epic_identifiers(self):
        import copy
        assurance,roadmap=self.load_valid_projections()
        sample_epic=copy.deepcopy(next(iter(roadmap["epics"].values())))
        invalid_ids=("EP-abc","BAD-1","EP-12-extra","","ep-01","EP-01\n","EP-\u0661")
        for bad_id in invalid_ids:
            with self.subTest(section="epics",bad_id=bad_id):
                mutated=copy.deepcopy(roadmap)
                mutated["epics"][bad_id]=copy.deepcopy(sample_epic)
                result=self.projection_gate(assurance,mutated)
                self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertIn("unexpected epic identifier",result.stdout)
            with self.subTest(section="progressHistory.epics",bad_id=bad_id):
                mutated=copy.deepcopy(roadmap)
                mutated["progressHistory"][0]["epics"][bad_id]=50
                result=self.projection_gate(assurance,mutated)
                self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertIn("unexpected epic identifier",result.stdout)

        module=self.load_projection_module()
        mutated_epics=copy.deepcopy(roadmap)
        mutated_epics["epics"][123]=copy.deepcopy(sample_epic)
        findings=module.validate_projections(assurance,mutated_epics)
        self.assertTrue(any("roadmap.epics.123: unexpected epic identifier" in item for item in findings),findings)

        mutated_history=copy.deepcopy(roadmap)
        mutated_history["progressHistory"][0]["epics"][456]=25
        findings=module.validate_projections(assurance,mutated_history)
        self.assertTrue(any("roadmap.progressHistory[0].epics.456: unexpected epic identifier" in item for item in findings),findings)

    def test_public_projection_rejects_punctuation_separated_sensitive_keys(self):
        import copy
        module=self.load_projection_module()
        assurance,roadmap=self.load_valid_projections()
        sensitive_keys=(
            "api.key",
            "secret:token",
            "access/token",
            "auth.bearer",
            "client.secret",
            "private:key",
            "ssh/key",
            "session.key",
            "API.KEY",
            "clientSecret",
            "APIKey",
            "passWord",
            "seCret",
            "toKen",
            "my.passWord",
            "myPassWord",
            "userPassWord",
            "authToKen",
            "mySeCret",
            "myApiKeY",
            "myPrivateKey",
            "myAccessKey",
            "mySecretKey",
            "pass\u200bword",
            "pass\ufeffword",
            "to\u200cken",
            "api\u200bKey",
        )
        for bad_key in sensitive_keys:
            with self.subTest(mode="direct",key=bad_key):
                findings=[]
                module.reject_sensitive({"nested":{bad_key:"synthetic-placeholder"}},"$",findings)
                self.assertTrue(
                    any("sensitive field name is not allowed in public projection" in item for item in findings),
                    f"Expected sensitive-key finding for {bad_key!r}, got {findings!r}",
                )
            with self.subTest(mode="subprocess",key=bad_key):
                mutated=copy.deepcopy(roadmap)
                mutated["planning"][bad_key]="synthetic-placeholder"
                result=self.projection_gate(assurance,mutated)
                self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertIn("sensitive field name is not allowed in public projection",result.stdout)

        # Benign keys containing "key" outside sensitive compounds MUST remain allowed.
        benign_findings=[]
        module.reject_sensitive(
            {
                "keyResults":["KR1.1"],
                "headlineKeyResults":["O1-HKR1"],
                "objectiveToHeadlineKeyResults":"one-to-many",
                "headlineKeyResultToEpics":"derived",
            },
            "$",
            benign_findings,
        )
        self.assertEqual(benign_findings,[])

    def test_public_projection_rejects_malformed_relationship_model_and_progress_history_values(self):
        import copy
        assurance,roadmap=self.load_valid_projections()

        for field in ("registeredMeasures","objectiveToEpics","objectiveToHeadlineKeyResults","headlineKeyResultToEpics","epicContributionSemantics"):
            for bad_value in ([],{},123,True,None,"","not-a-list","not-a-dict"):
                with self.subTest(section="relationshipModel",field=field,bad_value=bad_value):
                    mutated=copy.deepcopy(roadmap)
                    mutated["relationshipModel"][field]=bad_value
                    result=self.projection_gate(assurance,mutated)
                    self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                    self.assertIn(f"roadmap.relationshipModel.{field}:",result.stdout)

        first_history_epic=next(iter(roadmap["progressHistory"][0]["epics"]))
        for bad_value in ({"injected":"object"},"50",True,False,[50],None,50.5,-5,101,33):
            with self.subTest(section="progressHistory.epics",bad_value=bad_value):
                mutated=copy.deepcopy(roadmap)
                mutated["progressHistory"][0]["epics"][first_history_epic]=bad_value
                result=self.projection_gate(assurance,mutated)
                self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertIn(f"roadmap.progressHistory[0].epics.{first_history_epic}:",result.stdout)

        for bad_date in (123,None,{},"not-a-date","2026/09/19"):
            with self.subTest(section="progressHistory.date",bad_date=bad_date):
                mutated=copy.deepcopy(roadmap)
                mutated["progressHistory"][0]["date"]=bad_date
                result=self.projection_gate(assurance,mutated)
                self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertIn("roadmap.progressHistory[0].date:",result.stdout)

if __name__=="__main__":
    unittest.main()
