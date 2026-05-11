import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { SocketProvider } from '../realtime/SocketProvider';
import { store } from './store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>{children}</SocketProvider>
      </QueryClientProvider>
    </Provider>
  );
}
