import { useEffect, useState } from 'react'
import { paymentAPI } from '../services/api'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await paymentAPI.list()
      setPayments(response.data)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading payments...</div>
  }

  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const paidAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0)

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">💳 Payment History</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Total Amount" amount={totalAmount} color="blue" />
        <SummaryCard label="Paid" amount={paidAmount} color="green" />
        <SummaryCard label="Pending" amount={pendingAmount} color="orange" />
      </div>

      {/* Payments List */}
      <div className="card">
        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No payments yet. <a href="/book" className="text-blue-600 dark:text-blue-400 font-semibold">Book laundry</a> to make your first payment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Payment ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Method</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.payment_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 font-mono text-sm">{payment.payment_id}</td>
                    <td className="py-3 px-4 font-semibold">₹{parseFloat(payment.amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${payment.status === 'completed' ? 'badge-success' : payment.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize">{payment.payment_method}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, amount, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-2xl p-6 shadow-lg`}>
      <div className="text-gray-200 text-sm font-medium">{label}</div>
      <div className="text-4xl font-bold mt-2">₹{amount.toFixed(2)}</div>
    </div>
  )
}
