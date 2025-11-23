import statusBadgeStyles from '@/app/ui/status-badge.module.css'

interface BadgeStatus {
    currentStatus: 'active' | 'inactive'
}

export default function StatusBadge({currentStatus}: BadgeStatus) {
    return (
        <>
            <div className={statusBadgeStyles.badge}>
                <span className={
                    currentStatus === 'active' ?
                    statusBadgeStyles.active :
                    statusBadgeStyles.inactive}
                >{currentStatus}</span>
            </div>
        </>
    )
}