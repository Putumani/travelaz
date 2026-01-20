export default function LoadingSpinner({ size = 'medium' }) {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <div className={`inline-block ${sizes[size]} animate-spin rounded-full border-2 border-solid border-current border-r-transparent`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}