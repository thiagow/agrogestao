import { requireUser } from '@/lib/session';
import { TrocarSenhaForm } from './TrocarSenhaForm';

export default async function TrocarSenhaPage() {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-[#0b2310] flex items-center justify-center p-4">
      <TrocarSenhaForm email={user.email} />
    </div>
  );
}
