import { redirect } from 'next/navigation';
import { defaultTab } from '../lib/nav';

export default function RootPage() {
  redirect(`/${defaultTab}`);
}
