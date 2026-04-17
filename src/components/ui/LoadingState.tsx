interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="text-sm font-medium text-gray-400 dark:text-gray-500">{label}</div>
    </div>
  );
}
