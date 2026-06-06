import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface AuthLayoutProps {
    children: React.ReactNode
    /** Show a back chevron linking here */
    back?: string
    /** Unsplash/photo URL for the side panel */
    sideImage?: string
    /** Which side has the image */
    imageSide?: 'left' | 'right'
    /** Content overlaid on the image (bottom area) */
    imageCaption?: React.ReactNode
}

export function AuthLayout({
                               children,
                               back,
                               sideImage,
                               imageSide = 'right',
                               imageCaption,
                           }: AuthLayoutProps) {

    // ── Form pane ────────────────────────────────────────
    const formPane = (
        <div className="flex-1 flex flex-col bg-[#F7F8FA] min-h-screen">
            {/* Single nav — logo only, no duplicate */}
            <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-[#E8EAF0] flex-shrink-0">
                <Link href="/landing" className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#00C896] rounded-full" />
                    <span className="text-[#0A1628] font-bold text-base tracking-tight">CircuFi</span>
                </Link>
                {back && (
                    <Link href={back}
                          className="text-[#8A91A0] hover:text-[#0A1628] transition-colors"
                          aria-label="Go back">
                        <ChevronLeft size={20} />
                    </Link>
                )}
            </header>

            {/* Form content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-[400px]">
                    {children}
                </div>
            </div>
        </div>
    )

    // ── Image pane ───────────────────────────────────────
    const imagePane = sideImage ? (
        <div className="hidden lg:block w-[460px] xl:w-[520px] flex-shrink-0 relative overflow-hidden">
            <img src={sideImage} alt=""
                 className="absolute inset-0 w-full h-full object-cover" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/85 via-[#0A1628]/25 to-transparent" />
            {/* Caption bottom */}
            {imageCaption && (
                <div className="absolute bottom-10 left-8 right-8">{imageCaption}</div>
            )}
        </div>
    ) : null

    // No image — simple centered layout
    if (!sideImage) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
                <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-[#E8EAF0]">
                    <Link href="/landing" className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#00C896] rounded-full" />
                        <span className="text-[#0A1628] font-bold text-base tracking-tight">CircuFi</span>
                    </Link>
                    {back && (
                        <Link href={back} className="text-[#8A91A0] hover:text-[#0A1628] transition-colors" aria-label="Go back">
                            <ChevronLeft size={20} />
                        </Link>
                    )}
                </header>
                <div className="flex-1 flex items-center justify-center p-5">
                    <div className="w-full max-w-[400px]">{children}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            {imageSide === 'left' ? (
                <>{imagePane}{formPane}</>
            ) : (
                <>{formPane}{imagePane}</>
            )}
        </div>
    )
}