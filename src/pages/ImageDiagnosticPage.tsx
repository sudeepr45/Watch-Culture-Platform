export default function ImageDiagnosticPage() {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-base font-semibold">MOJEAN Image Comparison</h1>
      <p className="mb-6 text-sm">
        Browser and device HDR rendering may differ between these images.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold">ORIGINAL ULTRA HDR</h2>
          <img
            src="/image-diagnostic/original-ultra-hdr.jpg"
            alt="Original Ultra HDR photograph"
            className="block h-auto w-full"
          />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">VERIFIED SDR CONVERSION</h2>
          <img
            src="/image-diagnostic/verified-ultrahdr-sdr-srgb.jpg"
            alt="Verified SDR sRGB conversion of the original Ultra HDR photograph"
            className="block h-auto w-full"
          />
        </section>
      </div>
    </article>
  )
}
