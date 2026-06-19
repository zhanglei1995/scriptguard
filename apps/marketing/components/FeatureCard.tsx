interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl hover:border-primary-200 dark:border-gray-800 dark:bg-dark dark:hover:border-primary-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-500 group-hover:text-white dark:bg-primary-900/50 dark:text-primary-400">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-semibold text-dark dark:text-white">
        {title}
      </h3>
      <p className="mt-3 text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
