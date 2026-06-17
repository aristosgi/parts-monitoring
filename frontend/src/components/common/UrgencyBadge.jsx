export default function UrgencyBadge({ urgency }) {
  const urgencyColors = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800',
  }

  const urgencyLabels = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Urgent',
    5: 'Critical',
  }

  if (urgency == null) return null

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${urgencyColors[urgency] || urgencyColors[3]}`}>
      {urgencyLabels[urgency] || 'Unknown'} ({urgency})
    </span>
  )
}
