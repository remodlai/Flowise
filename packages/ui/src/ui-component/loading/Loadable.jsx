import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// project imports
import Loader from './Loader'

// ==============================|| LOADABLE - LAZY LOADING ||============================== //

// Error fallback component
const ErrorFallback = ({ error }) => {
    console.error('Lazy loading error:', error)
    return (
        <div role="alert" style={{ padding: '20px', color: 'red' }}>
            <h2>Something went wrong while loading this component:</h2>
            <pre>{error.message}</pre>
        </div>
    )
}

const Loadable = (Component) =>
    function WithLoader(props) {
        return (
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={<Loader />}>
                    <Component {...props} />
                </Suspense>
            </ErrorBoundary>
        )
    }

export default Loadable
