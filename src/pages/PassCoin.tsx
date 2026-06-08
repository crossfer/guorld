import { useParams } from 'react-router-dom'

export default function PassCoin() {
  const { slug } = useParams<{ slug: string }>()
  return <div>Pass coin — {slug}</div>
}
