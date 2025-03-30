import { IconClipboard, IconDownload } from '@tabler/icons-react'
import { memo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import PropTypes from 'prop-types'
import { Box, IconButton, Popover, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// Safe language list that we know work correctly
const SAFE_LANGUAGES = [
    'javascript',
    'python',
    'java',
    'c',
    'cpp',
    'csharp',
    'ruby',
    'php',
    'swift',
    'typescript',
    'go',
    'rust',
    'sql',
    'html',
    'css',
    'json',
    'xml',
    'yaml',
    'markdown',
    'bash',
    'shell',
    'plaintext',
    'text'
]

const programmingLanguages = {
    javascript: '.js',
    python: '.py',
    java: '.java',
    c: '.c',
    cpp: '.cpp',
    'c++': '.cpp',
    'c#': '.cs',
    csharp: '.cs',
    ruby: '.rb',
    php: '.php',
    swift: '.swift',
    'objective-c': '.m',
    kotlin: '.kt',
    typescript: '.ts',
    go: '.go',
    perl: '.pl',
    rust: '.rs',
    scala: '.scala',
    haskell: '.hs',
    lua: '.lua',
    shell: '.sh',
    sql: '.sql',
    html: '.html',
    css: '.css',
    json: '.json',
    xml: '.xml',
    yaml: '.yml',
    markdown: '.md',
    bash: '.sh',
    plaintext: '.txt',
    text: '.txt'
}

export const CodeBlock = memo(({ language, chatflowid, isDialog, value }) => {
    const theme = useTheme()
    const [anchorEl, setAnchorEl] = useState(null)
    const openPopOver = Boolean(anchorEl)

    // Make sure we use a safe language that won't cause errors
    const safeLang = language && SAFE_LANGUAGES.includes(language.toLowerCase()) 
        ? language.toLowerCase() 
        : 'plaintext'

    const handleClosePopOver = () => {
        setAnchorEl(null)
    }

    const copyToClipboard = (event) => {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            return
        }

        navigator.clipboard.writeText(value)
        setAnchorEl(event.currentTarget)
        setTimeout(() => {
            handleClosePopOver()
        }, 1500)
    }

    const downloadAsFile = () => {
        const fileExtension = programmingLanguages[safeLang] || '.file'
        const suggestedFileName = `file-${chatflowid}${fileExtension}`
        const fileName = suggestedFileName

        if (!fileName) {
            // user pressed cancel on prompt
            return
        }

        const blob = new Blob([value], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = fileName
        link.href = url
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div style={{ width: isDialog ? '' : 300 }}>
            <Box sx={{ color: 'white', background: theme.palette?.common.dark, p: 1, borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    {language || 'plaintext'}
                    <div style={{ flex: 1 }}></div>
                    <IconButton size='small' title='Copy' color='success' onClick={copyToClipboard}>
                        <IconClipboard />
                    </IconButton>
                    <Popover
                        open={openPopOver}
                        anchorEl={anchorEl}
                        onClose={handleClosePopOver}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right'
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left'
                        }}
                    >
                        <Typography variant='h6' sx={{ pl: 1, pr: 1, color: 'white', background: theme.palette.success.dark }}>
                            Copied!
                        </Typography>
                    </Popover>
                    <IconButton size='small' title='Download' color='primary' onClick={downloadAsFile}>
                        <IconDownload />
                    </IconButton>
                </div>
            </Box>

            <SyntaxHighlighter 
                language={safeLang} 
                style={vs} 
                customStyle={{ margin: 0 }}
                wrapLines={true}
                wrapLongLines={true}
            >
                {value || ''}
            </SyntaxHighlighter>
        </div>
    )
})
CodeBlock.displayName = 'CodeBlock'

CodeBlock.propTypes = {
    language: PropTypes.string,
    chatflowid: PropTypes.string,
    isDialog: PropTypes.bool,
    value: PropTypes.string
}
