import logo from '@/assets/images/remodl-logo.svg'
import logoDark from '@/assets/images/remodl-logo-dark.svg'

import { useSelector } from 'react-redux'

// ==============================|| LOGO ||============================== //

const Logo = (props) => {
    const customization = useSelector((state) => state.customization)
    const isDarkMode = customization.isDarkMode

    return (
        <div style={{ 
            alignItems: props.alignItems || 'center', 
            display: 'flex', 
            flexDirection: props.flexDirection || 'row', 
            justifyContent: props.justifyContent || 'center' 
        }}>
            <img
                style={{
                    objectFit: props.objectFit || 'contain',
                    height: props.height || 'auto',
                    width: props.width || 150
                }}
                src={isDarkMode ? logoDark : logo}
                alt='RemodlAI'
            />
        </div>
    )
}

export default Logo
// Props:
// - alignItems: CSS align-items property to align the logo vertically within its container. Default is 'center'.
// - flexDirection: CSS flex-direction property to define the direction of the logo and its container. Default is 'row'.
// - justifyContent: CSS justify-content property to align the logo horizontally within its container. Default is 'center'.
// - objectFit: CSS object-fit property to define how the logo should be resized to fit its container. Default is 'contain'.
// - height: CSS height property to define the height of the logo. Default is 'auto'.
// - width: CSS width property to define the width of the logo. Default is 150.
