import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUPPORT_NUMBER, SUPPORT_URL } from '@/lib/site-contact';

export function AccountSupport() {
  return <div className="border-t border-border pt-5 text-center">
    <p className="mb-3 text-sm leading-6 text-muted-fg">অ্যাকাউন্ট খুঁজে না পেলে বা কোনো সমস্যা হলে সরাসরি যোগাযোগ করুন।</p>
    <Button asChild variant="outline" className="h-auto min-h-11 gap-2 whitespace-normal"><a href={SUPPORT_URL} target="_blank" rel="noreferrer"><MessageCircle className="size-4 shrink-0" />Support · {SUPPORT_NUMBER}</a></Button>
  </div>;
}