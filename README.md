# AUX TRACK ADII v0.1.0

Separate edition from AUX TRACK (Nichole). Uses official mission codes referenced in AUX10; retains original AUX10 PDF without modification.

## Features
- Mobile-first activity logging, codes search and PDF reference.
- AUXDATA II Total Mission Excel import; duplicate prevention via MA identifiers.
- Excel export: ADII hours log workbook with standard mission code, activity, hours and MA ID.
- Printable PDF with totals by mission code.
- Device-local records under `aux_track_adii_v0_1`, separate from Nichole edition.
- Same approved logo and Coast Guard visual identity, distinct ADII title and PWA installation name.

## Testing and safety
- Import your Total Mission Excel and inspect preview before accepting. Re-import same file and verify no duplicates.
- The PDF reference is large (~45 MB). Some mobile PDF viewers ignore `#page=` deep links.
- Use a public GitHub repository only if redistribution of the AUX10 PDF is authorized.
- This is an unofficial personal tracker, not an official USCG platform.

## Deployment
Copy all folder contents to your separate `AUX_TRACK_ADII` repository root, then commit and push via GitHub Desktop. Enable GitHub Pages. Do not copy into the Nichole AUX_TRACK directory.
