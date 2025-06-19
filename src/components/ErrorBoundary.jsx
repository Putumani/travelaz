import { Component } from 'react';
import { useTranslation } from '../i18n/useTranslation';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-700">
          {t('errorLoadingHotel', { defaultValue: 'Error loading hotel. Please try again later.' })}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundaryWithTranslation(props) {
  const { t } = useTranslation();
  return <ErrorBoundary t={t} {...props} />;
}