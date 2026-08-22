import Link from "next/link";
import { BookOpenText } from "lucide-react";

export default function NotFound() {
  return <div className="v4-state-page"><BookOpenText /><h1>هذه الصفحة ليست هنا</h1><p>يمكنك العودة إلى وضّح وبدء قراءة جديدة.</p><Link href="/">العودة إلى الرئيسية</Link></div>;
}
