package utils

const (
	CtxKeyId       = "CTX_ID"
	CtxKeyAuthData = "auth_data"
)

const (
	RedisAppConf = "cache:config:app"
	RedisDbConf  = "cache:config:db"
)

const (
	RoleSuperAdmin = "superadmin"
	RoleAdmin      = "admin"
	RoleClient     = "client"
	RoleVendor     = "vendor"
)

const (
	EventDraft     = "draft"
	EventOpen      = "open"
	EventPending   = "pending"
	EventClosed    = "closed"
	EventCompleted = "completed"
	EventCancelled = "cancelled"
)

const (
	VendorPending = "pending"
	VendorVerify  = "verify"
	VendorActive  = "active"
	VendorReject  = "rejected"
	VendorSuspend = "suspended"
)

const (
	VendorDocPending  = "pending"
	VendorDocApproved = "approved"
	VendorDocReject   = "rejected"
)

var (
	MaxFileLimit  = GetEnv("MAX_FILE_LIMIT", 1).(int)
	MaxPhotoLimit = GetEnv("MAX_PHOTO_LIMIT", 5).(int)
)

const (
	NotifEventOpen   = "event_open"
	NotifEventWinner = "event_winner"
	NotifEventLoser  = "event_not_winner"
)
