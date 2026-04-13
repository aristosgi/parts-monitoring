export default function StatusBadge({ status }) {
  const statusColors = {
    'Pending': 'bg-gray-100 text-gray-800',
    'Waiting for Order': 'bg-yellow-100 text-yellow-800',
    'Under Order': 'bg-blue-100 text-blue-800',
    'In Transit': 'bg-purple-100 text-purple-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status] || statusColors['Pending']}`}>
      {status}
    </span>
  )
}
