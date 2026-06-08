import { useParams } from 'react-router-dom'

export default function CoinPage() {
  const { slug } = useParams<{ slug: string }>()
  return <div>Coin page — {slug}</div>
}
