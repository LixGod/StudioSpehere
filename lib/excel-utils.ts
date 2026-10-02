import type { Equipment, Issue, Profile } from "./types"

export function exportEquipmentToCSV(equipment: Equipment[]): string {
  const headers = [
    "Name",
    "Code",
    "Serial Number",
    "Category",
    "Status",
    "Condition",
    "Purchase Date",
    "Purchase Price",
    "Vendor Name",
    "Vendor Contact",
    "Vendor Email",
    "Quantity",
    "Notes",
  ]

  const rows = equipment.map((item) => [
    item.name,
    item.code || "",
    item.serial_number || "",
    item.category?.name || "",
    item.status,
    item.condition || "",
    item.purchase_date || "",
    item.purchase_price?.toString() || "",
    item.vendor_name || "",
    item.vendor_contact || "",
    item.vendor_email || "",
    item.quantity?.toString() || "1",
    item.notes || "",
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  return csvContent
}

export function exportIssuesToCSV(issues: Issue[]): string {
  const headers = [
    "Equipment",
    "Issued To",
    "Status",
    "Issue Date",
    "Expected Return",
    "Actual Return",
    "Return Condition",
    "Issue Notes",
    "Return Notes",
  ]

  const rows = issues.map((issue) => [
    issue.equipment?.name || "",
    issue.issued_to_profile?.email || "",
    issue.status,
    issue.issued_at ? new Date(issue.issued_at).toLocaleDateString() : "",
    issue.expected_return_date ? new Date(issue.expected_return_date).toLocaleDateString() : "",
    issue.actual_return_date ? new Date(issue.actual_return_date).toLocaleDateString() : "",
    issue.return_condition || "",
    issue.issue_notes || "",
    issue.return_notes || "",
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  return csvContent
}

export function exportEmployeesToCSV(employees: Profile[]): string {
  const headers = ["Name", "Email", "Role", "Joined Date"]

  const rows = employees.map((employee) => [
    employee.full_name || "",
    employee.email,
    employee.role,
    new Date(employee.created_at).toLocaleDateString(),
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  return csvContent
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export interface EquipmentImportRow {
  name: string
  serial_number?: string
  category?: string
  status?: string
  condition?: string
  purchase_date?: string
  purchase_price?: string
  notes?: string
}

/**
 * Parse a single CSV line into fields, handling quoted values.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let currentField = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      fields.push(currentField.trim())
      currentField = ""
    } else {
      currentField += char
    }
  }
  fields.push(currentField.trim())

  return fields
}

export function parseEquipmentCSV(csvText: string): EquipmentImportRow[] {
  const lines = csvText.trim().split("\n").filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  // Parse header row and make it case-insensitive so we can accept both
  // the simple import template and the full export file.
  const headerFields = parseCSVLine(lines[0]).map((h) => h.replace(/\r/g, "").trim().toLowerCase())

  const idx = (name: string) => headerFields.findIndex((h) => h === name.toLowerCase())

  const nameIdx = idx("name")
  const serialIdx = idx("serial number")
  const categoryIdx = idx("category")
  const statusIdx = idx("status")
  const conditionIdx = idx("condition")
  const purchaseDateIdx = idx("purchase date")
  const purchasePriceIdx = idx("purchase price")
  const notesIdx = idx("notes")

  const dataLines = lines.slice(1)

  return dataLines
    .map((line) => {
      const fields = parseCSVLine(line).map((f) => f.replace(/\r/g, "").trim())

      const getField = (index: number) => (index >= 0 && index < fields.length ? fields[index] || "" : "")

      const name = nameIdx >= 0 ? getField(nameIdx) : fields[0] || ""
      if (!name) return null

      return {
        name,
        serial_number: serialIdx >= 0 ? getField(serialIdx) || undefined : fields[1] || undefined,
        category: categoryIdx >= 0 ? getField(categoryIdx) || undefined : fields[2] || undefined,
        status: statusIdx >= 0 ? getField(statusIdx) || undefined : fields[3] || undefined,
        condition: conditionIdx >= 0 ? getField(conditionIdx) || undefined : fields[4] || undefined,
        purchase_date: purchaseDateIdx >= 0 ? getField(purchaseDateIdx) || undefined : fields[5] || undefined,
        purchase_price: purchasePriceIdx >= 0 ? getField(purchasePriceIdx) || undefined : fields[6] || undefined,
        notes: notesIdx >= 0 ? getField(notesIdx) || undefined : fields[7] || undefined,
      }
    })
    .filter((row): row is EquipmentImportRow => row !== null && row.name !== "")
}
