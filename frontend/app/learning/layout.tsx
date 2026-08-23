import LearningHeader from "@/components/learning/learning-header";

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return <div className="v4-learning-shell"><LearningHeader /><div className="v4-learning">{children}</div></div>;
}
