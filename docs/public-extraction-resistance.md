# Public Extraction Resistance Boundary

Infrastructure Product Works is intentionally demonstrable without publishing the implementation recipe.

## Increment 1: credential and artifact leakage

This first gate is intentionally narrow and additive. It does **not** remove, rewrite, score, or hide existing website content.

It fails closed on:
- conventional dotenv files and variants;
- private-key files and private-key signatures;
- GitHub, AWS, OpenAI, and Google API credential signatures, including bounded JSON-escaped representations;
- source maps;
- Terraform state and state backups;
- conventional machine-readable OpenAPI/Swagger specification filenames.

Later increments will separately address:
1. private implementation-repository/reference exposure; and
2. content, diagram, and demo-surface preservation.

Those concerns are intentionally split so each protection can be reviewed, merged, and verified independently without blocking the others.

Anything committed to this public repository must still be treated as disclosed.

## Regression evidence and limits

Run `python3 scripts/test_public_security_gates.py -v` to exercise the actual scanner processes with synthetic credentials, JSON escaping, chunk boundaries, binary assets, credential-bearing filenames/directories, restricted references in public paths, immutable CI baselines, and private-reference families. Fixtures construct fake values at runtime so no credential-looking values are committed. The extraction CI job runs these cases before scanning the repository.

The private-reference gate is a maintained deny list and compares against the immutable baseline. It does not discover all repositories or certify repository visibility. The credential gate recognizes specific provider signatures and up to eight JSON-decoding passes; it does not prove arbitrary encoding, encryption, steganography, historical commits, or hosted output free of sensitive data. Anything published remains disclosed. Keep implementation details in restricted repositories and independently inspect published artifacts when changing a publishing path.

Security maintenance follows protected pull requests and exact-head checks. Sole-owner operation does not require a second human approver. These source checks confer no production execution authority on AI.

Credential signatures are checked in complete file views and in decoded published relative paths. Credential-bearing paths are masked in credential-gate diagnostics. Private-reference paths are compared against the immutable baseline independently of body format; filename extensions do not hide a restricted repository identifier.
