import { getCustomers } from '@/lib/data'
import CustomersClient from './CustomersClient'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>
}) {
  const params = await searchParams
  const query = params?.query || ''
  const currentPage = Number(params?.page) || 1

  // Llamamos a nuestro motor de búsqueda de NPCs
  const customersData = await getCustomers(query, currentPage)

  return <CustomersClient initialNPCs={customersData} />
}
