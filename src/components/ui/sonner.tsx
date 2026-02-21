import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-center"
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        classNames: {
          closeButton: 'opacity-50 hover:opacity-100 !right-1 !top-1 !left-auto !-translate-y-0 !h-4 !w-4 !border-0 !bg-transparent',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
