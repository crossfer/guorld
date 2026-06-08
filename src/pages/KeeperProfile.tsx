import { useParams } from 'react-router-dom'

export default function KeeperProfile() {
  const { id } = useParams<{ id: string }>()
  return <div>Keeper profile — {id}</div>
}
