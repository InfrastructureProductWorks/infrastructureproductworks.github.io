#!/usr/bin/env python3
"""Build dependency-free guide pages from the reviewed public Markdown sources."""
import argparse
import hashlib
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPS = {
    'storefront': ('Storefront', 'Order a governed product', 'Find a product, submit an order, understand admission, and inspect the handoff.', 'https://infrastructureproductworks-storefront-44yf.onrender.com/', 'Open Storefront demo'),
    'guard': ('IaaP Guard', 'Assess a repository change', 'Install the GitHub App, read a pull-request assessment, resolve findings, and retain evidence.', 'https://github.com/apps/iaap-guard', 'Open GitHub App'),
    'console': ('IaaP Console', 'Review the evidence', 'Review independent orders, trace findings, record notes, and follow your role-specific procedure.', '/console/demo/', 'Open Console demo'),
    'assurance': ('IaaP Assurance', 'Explore bounded authority', 'Work through Sentry, Shield, custody, and the Portal; understand allowed, denied, and rolled-back outcomes.', '/assurance/demo/', 'Open Assurance demo'),
    'forge': ('IaaP Forge', 'Prepare a product proposal', 'Generate proposal evidence and understand the contributions of Security, Network, FinOps, and other domains.', 'https://iaap-forge-preview.onrender.com/', 'Open Forge preview'),
}

def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', re.sub(r'^\d+\s+', '', text).lower()).strip('-')

def inline(text):
    parts = re.split(r'(\[[^\]]+\]\(https?://[^)]+\)|\[[^\]]+\]\(/[^)]+\)|\*\*[^*]+\*\*|`[^`]+`)', text)
    out = []
    for part in parts:
        link = re.fullmatch(r'\[([^\]]+)\]\((https?://[^)]+|/[^)]+)\)', part)
        if link:
            out.append(f'<a href="{html.escape(link[2], quote=True)}">{html.escape(link[1])}</a>')
        elif part.startswith('**') and part.endswith('**'):
            out.append(f'<strong>{html.escape(part[2:-2])}</strong>')
        elif part.startswith('`') and part.endswith('`'):
            out.append(f'<code>{html.escape(part[1:-1])}</code>')
        else:
            out.append(html.escape(part))
    return ''.join(out)

def render(source):
    lines = source.splitlines()
    title = lines[0][2:]
    body, toc = [], []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith('# ') or line.startswith('End to end ') or line.startswith('Infrastructure Product Works |'):
            i += 1
            continue
        if line.startswith('## '):
            label = line[3:]
            anchor = slug(label)
            toc.append((anchor, re.sub(r'^\d+\s+', '', label)))
            body.append(f'<h2 id="{anchor}">{html.escape(label)}</h2>')
        elif line.startswith('### '):
            label = line[4:]
            body.append(f'<h3 id="{slug(label)}">{html.escape(label)}</h3>')
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[:\- ]+', c) for c in cells):
                    rows.append(cells)
                i += 1
            label = html.escape('Table: ' + ', '.join(rows[0]), quote=True)
            table = f'<div class="guide-table" role="region" tabindex="0" aria-label="{label}"><table><thead><tr>'
            table += ''.join(f'<th scope="col">{inline(c)}</th>' for c in rows[0]) + '</tr></thead><tbody>'
            table += ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in row) + '</tr>' for row in rows[1:])
            body.append(table + '</tbody></table></div>')
            continue
        elif line.startswith('- ') or re.match(r'^\d+\. ', line):
            ordered = not line.startswith('- ')
            tag = 'ol' if ordered else 'ul'
            body.append(f'<{tag}>')
            while i < len(lines) and (bool(re.match(r'^\d+\. ', lines[i])) if ordered else lines[i].startswith('- ')):
                text = re.sub(r'^(\d+\. |- )', '', lines[i])
                body.append(f'<li>{inline(text)}</li>')
                i += 1
            body.append(f'</{tag}>')
            continue
        else:
            body.append(f'<p>{inline(line)}</p>')
        i += 1
    return title, '\n'.join(body), toc

def page(title, description, content):
    header = re.search(r'<header>.*?</header>', (ROOT/'index.html').read_text(), re.S).group()
    css = (ROOT/'assets/guides.css').read_bytes()
    digest = hashlib.sha1(b'blob ' + str(len(css)).encode() + b'\0' + css).hexdigest()
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)} | Infrastructure Product Works</title><meta name="description" content="{html.escape(description, quote=True)}">
<link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#ffffff">
<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/guides.css?v={digest}"></head>
<body class="guide-page"><a class="guide-skip" href="#guide-content">Skip to instructions</a>{header}
<main id="guide-content">{content}</main>
<footer><strong>Infrastructure Product Works</strong><div><a href="/guides/">All user guides</a><a href="/docs/guard/">Guard documentation</a><a href="/operating-model/">How It Works</a><a href="/support/">Contact</a></div><p>Step-by-step guidance for the current evaluation experiences.</p></footer></body></html>
'''

def guide(app, config):
    name, task, description, demo, action = config
    source = (ROOT/f'guides/content/{app}.md').read_text()
    title, body, toc = render(source)
    contents = '<ol>' + ''.join(f'<li><a href="#{a}">{html.escape(t)}</a></li>' for a, t in toc) + '</ol>'
    roles = ''
    if app == 'console':
        roles = '<div class="guide-role-links" aria-label="Role-specific instructions">' + ''.join(f'<a href="#{anchor}">{label}</a>' for anchor, label in [('security-reviewer','Security'),('architecture-reviewer','Architecture'),('platform-reviewer','Platform'),('product-reviewer','Product'),('audit-or-assessor-reviewer','Audit')]) + '</div>'
    if app == 'forge':
        roles = '<div class="guide-role-links" aria-label="Domain contribution instructions"><a href="#determine-your-domain-contribution">Domain responsibilities</a><a href="#security-example">Security example</a><a href="#follow-the-domain-contribution-workflow">Contribution workflow</a></div>'
    extra = '<a class="button ghost" href="/assurance/portal/" target="_blank" rel="noopener noreferrer">Open Assurance Portal</a>' if app == 'assurance' else ''
    content = f'''<section class="guide-hero"><p class="guide-breadcrumb"><a href="/guides/">User guides</a> / {name}</p><p class="eyebrow">{task.upper()}</p><h1>{html.escape(title)}</h1><p class="lede">{description}</p><p class="guide-meta">Updated September 24, 2026 · Read in your browser or print from the browser menu.</p><div class="actions"><a class="button" href="{demo}" target="_blank" rel="noopener noreferrer">{action} <span aria-hidden="true">↗</span><span class="guide-new-tab"> (new tab)</span></a>{extra}<a class="button ghost" href="/{app}/">Product overview</a></div>{roles}</section>
<div class="guide-layout"><nav class="guide-toc" aria-label="On this page"><strong>On this page</strong>{contents}</nav><div><details class="guide-jump"><summary>Jump to a step</summary>{contents}</details><article class="guide-article" aria-label="{html.escape(name)} instructions">{body}</article></div></div>'''
    return page(title, description, content)

def hub():
    cards = []
    for app, (name, task, description, demo, action) in APPS.items():
        cards.append(f'<article class="guide-card"><small>{task.upper()}</small><h2>{name}</h2><p>{description}</p><div class="actions"><a class="button" href="/guides/{app}/">Read {name} guide</a><a class="button ghost" href="{demo}" target="_blank" rel="noopener noreferrer">{action} (new tab)</a></div></article>')
    content = '''<section class="guide-hub"><p class="eyebrow">APPLICATION USER GUIDES</p><h1>Work through each app,<br>one step at a time.</h1><p class="lede">Start with the task you want to complete. Each guide explains the inputs, controls, expected results, troubleshooting, and the point where the current experience stops.</p><div class="guide-note">Use fictional information in the public demos. Each demo is a separate evaluation experience; a matching order ID does not establish a connected workflow.</div><div class="guide-role-links" aria-label="Start by responsibility"><a href="/guides/console/#security-reviewer">Review as Security</a><a href="/guides/console/#role-specific-review-procedures">Console review roles</a><a href="/guides/forge/#determine-your-domain-contribution">Forge domain responsibilities</a><a href="/guides/assurance/#read-the-assurance-portal">Read the Assurance Portal</a></div><div class="guide-grid">''' + ''.join(cards) + '''</div><p class="guide-meta">Updated September 24, 2026. Guard uses the hosted GitHub App. Storefront, Forge, Console, and Assurance provide the evaluation experiences described in their guides.</p></section>'''
    return page('Application User Guides', 'Step-by-step user guides for Storefront, Guard, Console, Assurance, and Forge, including Security and other role-specific responsibilities.', content)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    outputs = {ROOT/'guides/index.html':hub()}
    outputs.update({ROOT/f'guides/{app}/index.html':guide(app, config) for app, config in APPS.items()})
    for path, content in outputs.items():
        if args.check:
            if not path.exists() or path.read_text() != content:
                raise SystemExit(f'Rebuild guide: {path.relative_to(ROOT)}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
    print(f'{len(outputs)} guide pages ' + ('verified.' if args.check else 'built.'))

if __name__ == '__main__':
    main()
