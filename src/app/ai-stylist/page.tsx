import { redirect } from 'next/navigation'

// AI Stylist redirects to AI Dresser (same feature, different name)
export default function AIStylistPage() {
  redirect('/ai-dresser')
}
