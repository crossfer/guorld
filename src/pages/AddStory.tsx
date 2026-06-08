import { useParams } from 'react-router-dom'

export default function AddStory() {
  const { slug } = useParams<{ slug: string }>()
  return <div>Add story — coin {slug}</div>
}
