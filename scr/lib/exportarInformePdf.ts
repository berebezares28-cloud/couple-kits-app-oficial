export async function exportarElementoPdf(
  element: HTMLElement,
  nombreArchivo: string
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false
  })

  const imgData = canvas.toDataURL('image/png')
  const pageWidth = 210
  const imgHeight = (canvas.height * pageWidth) / canvas.width

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [pageWidth, imgHeight]
  })

  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight)

  pdf.save(nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`)
}

export function nombreArchivoInforme(
  etiquetaMes: string,
  etiquetaFormato: string
): string {
  const mes = etiquetaMes
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
  const formato = etiquetaFormato
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')

  return `informe-${formato}-${mes}.pdf`
}
