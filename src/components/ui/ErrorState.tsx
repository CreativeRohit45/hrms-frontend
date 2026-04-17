interface ErrorStateProps {
  title?: string;
  message: string;
}

export function ErrorState({ title = "Something went wrong", message }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950/30">
      <p className="font-bold text-red-700 dark:text-red-300">{title}</p>
      <p className="mt-1 text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
}
