import { useParams } from 'react-router-dom';
import Section, { SectionItem } from '../components/Section.js';

interface CollectionItem {
  id: string | number;
  title: string;
  data: SectionItem[];
}

export default function Page() {
  const { id } = useParams();

  const collections = JSON.parse(localStorage.getItem('collections') || '[]') as CollectionItem[];
  const data = collections.find((coll) => String(coll.id) === String(id));
  if (!data) return null;
  return <Section title={data.title} data={data.data} />;
}
