import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function HomeScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // TODO: Navegar a dashboard
        // router.push('/dashboard')
        setIsLoading(false)
      } else {
        router.replace('/auth/login')
      }
    }

    checkSession()
  }, [])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.text}>Cargando...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard - Coming Soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  text: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
})
