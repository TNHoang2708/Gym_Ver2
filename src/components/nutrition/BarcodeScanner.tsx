'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ScanLine, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BarcodeScannerProps {
  onScanSuccess: (food: any) => void
  onClose: () => void
}

async function getFoodByBarcode(barcode: string): Promise<any | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    const data = await res.json()
    if (data.status === 1 && data.product) {
      const p = data.product
      const n = (p.nutriments ?? {}) as Record<string, number>
      return {
        food_name: String(p.product_name || 'Unknown Product'),
        calories:  Math.round(n['energy-kcal_100g'] ?? (n['energy_100g'] ?? 0) / 4.184),
        protein_g: Math.round(n['proteins_100g'] ?? 0),
        carbs_g:   Math.round(n['carbohydrates_100g'] ?? 0),
        fat_g:     Math.round(n['fat_100g'] ?? 0),
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader")
      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          if (isScanning) return
          setIsScanning(true)
          
          toast.success("Barcode scanned! Fetching food...")
          const result = await getFoodByBarcode(decodedText)
          
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current?.clear()
              if (result) {
                onScanSuccess(result)
                toast.success("Found " + result.food_name)
              } else {
                toast.error("Food not found in database.")
              }
              onClose()
            }).catch(console.error)
          }
        },
        () => {} // ignore
      ).catch((err) => {
        toast.error("Could not start camera.")
        console.error(err)
        onClose()
      })
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear()
        }).catch(console.error)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/10 flex flex-col items-center">
      <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden border border-white/5 mb-4 bg-black"></div>
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        {isScanning ? <Loader2 className="w-3 h-3 animate-spin text-gold" /> : <ScanLine className="w-3 h-3" />}
        {isScanning ? "Fetching Open Food Facts..." : "Position a barcode in the view"}
      </p>
    </div>
  )
}
