import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SplitPaymentFlow from './SplitPaymentFlow'

interface Props {
  params: { shareCode: string }
}

export default async function PublicSplitPage({ params }: Props) {
  const splitGroup = await prisma.splitGroup.findUnique({
    where: { shareCode: params.shareCode.toUpperCase() },
    include: {
      receipt: {
        include: {
          establishment: true,
          receiptItems: true,
        },
      },
      splitMembers: true,
    },
  })

  if (!splitGroup) notFound()

  return (
    <SplitPaymentFlow
      splitGroup={{
        id: splitGroup.id,
        shareCode: splitGroup.shareCode,
        totalAmount: splitGroup.totalAmount,
        amountCollected: splitGroup.amountCollected,
        status: splitGroup.status,
        receipt: {
          id: splitGroup.receipt.id,
          subtotal: splitGroup.receipt.subtotal,
          tax: splitGroup.receipt.tax,
          gratuity: splitGroup.receipt.gratuity,
          totalAmount: splitGroup.receipt.totalAmount,
          establishment: {
            name: splitGroup.receipt.establishment.name,
            address: splitGroup.receipt.establishment.address,
          },
          items: splitGroup.receipt.receiptItems.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
        members: splitGroup.splitMembers.map((m) => ({
          id: m.id,
          name: m.name,
          amountOwed: m.amountOwed,
          status: m.status,
        })),
      }}
    />
  )
}
