# MOJEAN standalone image normalizer

This isolated Node CLI and library is not imported by the React app and is not connected to Stories, Bulletin, Curator, Supabase, storage, or production upload flows.

## Runtime and usage

The current runner targets Windows. It requires a libvips bundle with JPEG, Ultra HDR, PNG, and WebP support. Configure `MOJEAN_VIPS_PATH` with the `vips.exe` path or its containing bundle/bin directory. The normalizer does not install libvips or npm dependencies. The runtime also requires a sibling `vipsheader.exe` and a valid sRGB ICC profile recognized by libvips.

```powershell
$env:MOJEAN_VIPS_PATH = 'C:\path\to\libvips\bin'
node tools/image-normalizer/cli.mjs inspect --input photo.jpg
node tools/image-normalizer/cli.mjs normalize --input photo.jpg --output normalized.jpg
```

Each libvips process runs through a Windows Job Object with a **768 MiB aggregate process-tree memory limit**. The child starts suspended and is assigned to the job before it resumes. The operation fails closed if that limit cannot be established. The runner also limits execution time and captured diagnostics. This process boundary is currently Windows-specific.

Inputs are file paths; format is detected from image contents rather than extension or claimed MIME. Successful output is a new opaque, upright, three-channel SDR JPEG with an embedded sRGB profile. The source is never overwritten. The destination must not already exist and is linked into place only after output verification succeeds. EXIF, XMP, IPTC, and gain-map metadata are not retained.

## Processing and limits

Initial resource limits (proposed values, not permanent or production-validated policy):

| Limit | Value |
| --- | ---: |
| Compressed input size | 10 MiB |
| Maximum width / height | 8,192 px each |
| Total pixels | 10,000,000 |
| Estimated working memory | 576 MiB |
| Native process-tree boundary | 768 MiB |

The estimate is `pixel count × 51 bytes + 64 MiB + compressed input bytes`. File size is checked before reading image contents. The bounded header parser detects format and dimensions, then checks dimensions, total pixels, and estimated memory with `BigInt` arithmetic before any libvips pixel decode. Invalid, missing, or malformed dimensions and over-limit input fail closed. The 30,000 × 30,000 fixture is rejected after header parsing and before libvips is launched.

JPEG, Ultra HDR JPEG, PNG, and WebP are supported; other formats and animated PNG/WebP are rejected. Ultra HDR is decoded by libvips' `uhdrload`, which supplies the SDR/base rendition for conversion. The gain map is not copied to the result. EXIF orientation is applied before encoding. Embedded ICC profiles are transformed to sRGB; untagged input is accepted only when its interpretation can be safely treated as sRGB or grayscale. Alpha is composited over white for JPEG output.

The isolated tests include a locally generated Adobe RGB ICC profile fixture to exercise profile conversion. This verifies the transform path with that fixture, not all possible wide-gamut camera profiles.

Output verification reopens the encoded file, checks standard JPEG format and dimensions, verifies an embedded sRGB profile, confirms orientation and gain-map metadata are absent, and fully decodes the output before success. Temporary work is removed on both success and failure. A failed run does not publish a partial destination.

Failure results use `NormalizerError` with stable codes, including `INPUT_ERROR`, `INPUT_TOO_LARGE`, `UNSUPPORTED_FORMAT`, `INVALID_HEADER`, `INVALID_DIMENSIONS`, `LIMIT_EXCEEDED`, `RUNTIME_CONFIG`, `RUNTIME_FAILURE`, `OUTPUT_ERROR`, and `VERIFICATION_FAILED`.

## Fixtures and tests

The test corpus is isolated under `tools/image-normalizer/test/fixtures`; test outputs and temporary workspaces are created in the OS temp directory. The real F91W and ordinary SDR inputs are supplied as read-only local paths:

```powershell
$env:MOJEAN_VIPS_PATH = 'C:\path\to\libvips\bin'
$env:MOJEAN_NORM_FIXTURE_F91W = 'C:\path\to\mojean-f91w.jpg'
$env:MOJEAN_NORM_FIXTURE_JPEG = 'C:\path\to\independent-sdr.jpg'
$env:MOJEAN_NORM_FIXTURE_PNG = 'C:\path\to\independent-image.png'
$env:MOJEAN_NORM_FIXTURE_OVERSIZED_DIMENSIONS = 'C:\path\to\oversized-dimensions-header-only.jpg'
$env:MOJEAN_NORM_FIXTURE_CORRUPT = 'C:\path\to\corrupt-truncated.jpg'
$env:MOJEAN_NORM_FIXTURE_MALFORMED = 'C:\path\to\malformed-text.jpg'
npm.cmd --prefix tools/image-normalizer test
```

To regenerate the checked-in test-only WebP, orientation, and Adobe RGB fixtures, set `MOJEAN_NORM_FIXTURE_JPEG` and `MOJEAN_NORM_FIXTURE_PNG`, then run `node tools/image-normalizer/scripts/generate-fixtures.mjs`. These are test fixtures, not production content.

## Known limitation

**HDR-display visual equivalence was not verified on the Phase 1 machine because its active display path was not HDR-capable.** The normalizer does not claim this limitation has been resolved.
