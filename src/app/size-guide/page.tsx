import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Ruler } from 'lucide-react'

export const metadata = {
  title: 'Size Guide | America Brands Bazaar',
  description: 'Find your perfect fit with the America Brands Bazaar size guide for clothes, shoes, and accessories.',
}

function SizeTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
      <h3 className="font-bold text-navy text-lg mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="bg-navy/5 rounded-lg">
              {headers.map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-navy font-semibold text-xs uppercase tracking-wider first:rounded-l-lg last:rounded-r-lg">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-cream/50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className={`px-3 py-3 ${j === 0 ? 'font-semibold text-navy' : 'text-gray-600'}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function SizeGuidePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-24">

        {/* Hero */}
        <section className="bg-navy py-14">
          <div className="container-max px-4 md:px-8 text-center">
            <span className="text-gold text-sm font-semibold uppercase tracking-widest mb-3 block">Fit Guide</span>
            <h1 className="text-4xl font-bold text-white mb-3">Size Guide</h1>
            <p className="text-white/60 max-w-xl mx-auto">
              Find your perfect fit. All measurements are in centimeters (cm) unless stated otherwise.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container-max px-4 md:px-8 max-w-5xl mx-auto space-y-10">

            {/* Tip */}
            <div className="bg-gold/10 border border-gold/20 rounded-2xl p-5 flex gap-3">
              <Ruler className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
              <p className="text-navy text-sm leading-relaxed">
                <strong>How to measure:</strong> Use a soft measuring tape. Measure over light clothing or bare skin. For chest: measure around the fullest part. For waist: measure around the narrowest point. For hips: measure around the fullest part.
              </p>
            </div>

            {/* Men's Tops */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">Men&apos;s Tops & T-Shirts</h2>
              <SizeTable
                title="Men's Shirt Size Chart"
                headers={['Size', 'Chest (cm)', 'Shoulder (cm)', 'Length (cm)', 'US/EU Size']}
                rows={[
                  ['XS', '84–88', '42–43', '68', 'XS'],
                  ['S', '88–92', '43–44', '70', 'S'],
                  ['M', '92–96', '44–45', '72', 'M'],
                  ['L', '96–100', '45–46', '74', 'L'],
                  ['XL', '100–104', '46–47', '76', 'XL'],
                  ['XXL', '104–110', '47–49', '78', 'XXL'],
                  ['3XL', '110–116', '49–51', '80', '3XL'],
                ]}
              />
            </div>

            {/* Men's Pants */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">Men&apos;s Pants & Jeans</h2>
              <SizeTable
                title="Men's Pants Size Chart"
                headers={['Waist (in)', 'Waist (cm)', 'Hip (cm)', 'Inseam (cm)', 'US Size']}
                rows={[
                  ['28"', '71', '88', '76', '28'],
                  ['30"', '76', '92', '78', '30'],
                  ['32"', '81', '96', '79', '32'],
                  ['34"', '86', '100', '80', '34'],
                  ['36"', '91', '104', '81', '36'],
                  ['38"', '96', '108', '82', '38'],
                  ['40"', '101', '112', '82', '40'],
                ]}
              />
            </div>

            {/* Women's Tops */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">Women&apos;s Tops & Dresses</h2>
              <SizeTable
                title="Women's Size Chart"
                headers={['Size', 'Bust (cm)', 'Waist (cm)', 'Hip (cm)', 'US/EU Size']}
                rows={[
                  ['XS', '80–83', '62–65', '88–91', 'XS / EU 32'],
                  ['S', '84–87', '66–69', '92–95', 'S / EU 34–36'],
                  ['M', '88–91', '70–73', '96–99', 'M / EU 38–40'],
                  ['L', '92–95', '74–77', '100–103', 'L / EU 42'],
                  ['XL', '96–99', '78–81', '104–107', 'XL / EU 44'],
                  ['XXL', '100–104', '82–86', '108–112', 'XXL / EU 46'],
                ]}
              />
            </div>

            {/* Shoes */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">Shoes</h2>
              <SizeTable
                title="Shoe Size Conversion"
                headers={['US Men', 'US Women', 'EU', 'UK', 'Foot Length (cm)']}
                rows={[
                  ['5', '6.5', '37–38', '4.5', '23.5'],
                  ['6', '7.5', '38–39', '5.5', '24.1'],
                  ['7', '8.5', '39–40', '6', '24.8'],
                  ['8', '9.5', '41', '7', '25.4'],
                  ['9', '10.5', '42–43', '8', '26.7'],
                  ['10', '11.5', '43–44', '9', '27.3'],
                  ['11', '12.5', '45', '10', '27.9'],
                  ['12', '13.5', '46', '11', '28.6'],
                ]}
              />
            </div>

            {/* Tips */}
            <div className="bg-navy rounded-2xl p-8 text-white text-center">
              <h3 className="text-xl font-bold mb-2">Still Not Sure About Your Size?</h3>
              <p className="text-white/60 mb-5 text-sm">Our team is happy to help you find the perfect fit.</p>
              <a href="/contact" className="inline-block bg-gold text-navy font-bold px-7 py-3 rounded-full hover:bg-white transition-colors text-sm">
                Ask Us Directly
              </a>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
