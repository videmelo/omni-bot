import { useParams } from 'react-router-dom';
import Section from '../components/Section.js';

export default function Page() {
   const { id } = useParams();

   const data = JSON.parse(localStorage.getItem('collections') || '[]').find((coll: any) => coll.id == id);
   return <Section title={data.title} data={data.data} />;
}
