import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton={false}
      gap={10}
      offset={16}
      toastOptions={{ duration: 4500 }}
      {...props}
    />
  )
}
