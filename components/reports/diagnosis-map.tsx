"use client"

import * as React from "react"
import L from "leaflet"

import type { DiagnosisMapReport } from "@/lib/data/clinic"

type DiagnosisMapProps = {
  report: DiagnosisMapReport
}

export function DiagnosisMap({ report }: DiagnosisMapProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null)
  const leafletRef = React.useRef<L.Map | null>(null)
  const layerRef = React.useRef<L.LayerGroup | null>(null)
  const mappedLocations = report.locations.filter((location) => location.latitude !== null && location.longitude !== null)

  React.useEffect(() => {
    if (!mapRef.current || leafletRef.current) {
      return
    }

    const map = L.map(mapRef.current, {
      center: [-2.5, 118],
      zoom: 5,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      scrollWheelZoom: false,
      touchZoom: true,
      doubleClickZoom: true,
    })
    const container = map.getContainer()
    const handleWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        const rect = container.getBoundingClientRect()
        const point = L.point(event.clientX - rect.left, event.clientY - rect.top)
        const nextZoom = map.getZoom() + (event.deltaY < 0 ? 0.5 : -0.5)

        map.setZoomAround(point, Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), nextZoom)), {
          animate: true,
        })
      }
    }

    container.addEventListener("wheel", handleWheelZoom, { passive: false, capture: true })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    const layer = L.layerGroup().addTo(map)
    leafletRef.current = map
    layerRef.current = layer

    return () => {
      container.removeEventListener("wheel", handleWheelZoom, { capture: true })
      map.remove()
      leafletRef.current = null
      layerRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const map = leafletRef.current
    const layer = layerRef.current

    if (!map || !layer) {
      return
    }

    layer.clearLayers()

    if (mappedLocations.length === 0) {
      map.setView([-2.5, 118], 5)
      return
    }

    const maxCases = Math.max(...mappedLocations.map((location) => location.caseCount), 1)
    const bounds = L.latLngBounds([])

    for (const location of mappedLocations) {
      const lat = location.latitude
      const lng = location.longitude

      if (lat === null || lng === null) {
        continue
      }

      const intensity = location.caseCount / maxCases
      const radius = Math.max(8, Math.min(28, 8 + intensity * 20))
      const color = intensity > 0.66 ? "#dc2626" : intensity > 0.33 ? "#f59e0b" : "#0f766e"
      const diagnoses = location.topDiagnoses.map((diagnosis) => `${diagnosis.name} (${diagnosis.count})`).join(", ") || "-"

      L.circleMarker([lat, lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.28,
        weight: 2,
      })
        .bindPopup(`<strong>${location.region}</strong><br/>Kasus: ${location.caseCount}<br/>Pasien: ${location.patientCount}<br/>Diagnosis: ${diagnoses}`)
        .addTo(layer)

      bounds.extend([lat, lng])
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 })
    }
  }, [mappedLocations])

  return <div ref={mapRef} className="h-[28rem] min-h-80 w-full overflow-hidden rounded-md border border-border bg-muted" aria-label="Peta persebaran diagnosis" />
}
