package router

import (
	"net/http"
	"time"
	"vendor-management-system/infrastructure/media"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"vendor-management-system/infrastructure/database"
	evaluationHandler "vendor-management-system/internal/handlers/http/evaluations"
	eventHandler "vendor-management-system/internal/handlers/http/events"
	locationHandler "vendor-management-system/internal/handlers/http/location"
	menuHandler "vendor-management-system/internal/handlers/http/menu"
	paymentHandler "vendor-management-system/internal/handlers/http/payments"
	permissionHandler "vendor-management-system/internal/handlers/http/permission"
	roleHandler "vendor-management-system/internal/handlers/http/role"
	sessionHandler "vendor-management-system/internal/handlers/http/session"
	userHandler "vendor-management-system/internal/handlers/http/user"
	vendorHandler "vendor-management-system/internal/handlers/http/vendors"
	authRepo "vendor-management-system/internal/repositories/auth"
	evaluationRepo "vendor-management-system/internal/repositories/evaluations"
	eventRepo "vendor-management-system/internal/repositories/events"
	menuRepo "vendor-management-system/internal/repositories/menu"
	paymentRepo "vendor-management-system/internal/repositories/payments"
	permissionRepo "vendor-management-system/internal/repositories/permission"
	roleRepo "vendor-management-system/internal/repositories/role"
	sessionRepo "vendor-management-system/internal/repositories/session"
	userRepo "vendor-management-system/internal/repositories/user"
	vendorRepo "vendor-management-system/internal/repositories/vendors"
	evaluationSvc "vendor-management-system/internal/services/evaluations"
	eventSvc "vendor-management-system/internal/services/events"
	locationSvc "vendor-management-system/internal/services/location"
	menuSvc "vendor-management-system/internal/services/menu"
	paymentSvc "vendor-management-system/internal/services/payments"
	permissionSvc "vendor-management-system/internal/services/permission"
	roleSvc "vendor-management-system/internal/services/role"
	sessionSvc "vendor-management-system/internal/services/session"
	userSvc "vendor-management-system/internal/services/user"
	vendorSvc "vendor-management-system/internal/services/vendors"
	"vendor-management-system/middlewares"
	"vendor-management-system/pkg/logger"
	"vendor-management-system/pkg/security"
	"vendor-management-system/utils"
)

type Routes struct {
	App *gin.Engine
	DB  *gorm.DB
}

func NewRoutes() *Routes {
	app := gin.Default()

	app.Use(middlewares.CORS())
	app.Use(gin.CustomRecovery(middlewares.ErrorHandler))
	app.Use(middlewares.SetContextId())

	app.GET("/healthcheck", func(ctx *gin.Context) {
		logger.WriteLog(logger.LogLevelDebug, "ClientIP: "+ctx.ClientIP())
		ctx.JSON(http.StatusOK, gin.H{
			"message": "OK!!",
		})
	})

	return &Routes{
		App: app,
	}
}

func (r *Routes) UserRoutes() {
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	repo := userRepo.NewUserRepo(r.DB)
	rRepo := roleRepo.NewRoleRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	uc := userSvc.NewUserService(repo, blacklistRepo, rRepo, pRepo)

	// Setup login limiter if Redis is available
	redisClient := database.GetRedisClient()
	var loginLimiter security.LoginLimiter
	if redisClient != nil {
		loginLimiter = security.NewRedisLoginLimiter(
			redisClient,
			utils.GetEnv("LOGIN_ATTEMPT_LIMIT", 5).(int),
			time.Duration(utils.GetEnv("LOGIN_ATTEMPT_WINDOW_SECONDS", 60).(int))*time.Second,
			time.Duration(utils.GetEnv("LOGIN_BLOCK_DURATION_SECONDS", 300).(int))*time.Second,
		)
	}

	h := userHandler.NewUserHandler(uc, loginLimiter)
	mdw := middlewares.NewMiddleware(blacklistRepo)

	// Setup register rate limiter
	registerLimit := utils.GetEnv("REGISTER_RATE_LIMIT", 5).(int)
	registerWindowSeconds := utils.GetEnv("REGISTER_RATE_WINDOW_SECONDS", 60).(int)
	if registerWindowSeconds <= 0 {
		registerWindowSeconds = 60
	}
	registerLimiter := middlewares.IPRateLimitMiddleware(
		redisClient,
		"user_register",
		registerLimit,
		time.Duration(registerWindowSeconds)*time.Second,
	)

	user := r.App.Group("/api/user")
	{
		user.POST("/register", registerLimiter, h.Register)
		user.POST("/login", h.Login)
		user.POST("/forgot-password", h.ForgotPassword)
		user.POST("/reset-password", h.ResetPassword)

		userPriv := user.Group("").Use(mdw.AuthMiddleware())
		{
			userPriv.POST("/logout", h.Logout)
			userPriv.GET("", h.GetUserByAuth)
			userPriv.GET("/:id", mdw.RoleMiddleware(utils.RoleAdmin), h.GetUserById)
			userPriv.PUT("", h.Update)
			userPriv.PUT("/:id", mdw.RoleMiddleware(utils.RoleAdmin), h.UpdateUserById)
			userPriv.PUT("/change/password", h.ChangePassword)
			userPriv.DELETE("", h.Delete)
			userPriv.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin), h.DeleteUserById)
		}
	}

	r.App.GET("/api/users", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleSuperAdmin, utils.RoleAdmin), h.GetAllUsers)
}

func (r *Routes) RoleRoutes() {
	repoRole := roleRepo.NewRoleRepo(r.DB)
	repoPermission := permissionRepo.NewPermissionRepo(r.DB)
	repoMenu := menuRepo.NewMenuRepo(r.DB)
	svc := roleSvc.NewRoleService(repoRole, repoPermission, repoMenu)
	h := roleHandler.NewRoleHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	r.App.GET("/api/roles", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin), h.GetAll)

	role := r.App.Group("/api/role").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin))
	{
		role.POST("", h.Create)
		role.GET("/:id", h.GetByID)
		role.PUT("/:id", h.Update)
		role.DELETE("/:id", h.Delete)

		role.POST("/:id/permissions", h.AssignPermissions)
		role.POST("/:id/menus", h.AssignMenus)
	}
}

func (r *Routes) PermissionRoutes() {
	repo := permissionRepo.NewPermissionRepo(r.DB)
	svc := permissionSvc.NewPermissionService(repo)
	h := permissionHandler.NewPermissionHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	r.App.GET("/api/permissions", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin), h.GetAll)
	r.App.GET("/api/permissions/me", mdw.AuthMiddleware(), h.GetUserPermissions)

	permission := r.App.Group("/api/permission").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin))
	{
		permission.POST("", h.Create)
		permission.GET("/:id", h.GetByID)
		permission.PUT("/:id", h.Update)
		permission.DELETE("/:id", h.Delete)
	}
}

func (r *Routes) MenuRoutes() {
	repo := menuRepo.NewMenuRepo(r.DB)
	svc := menuSvc.NewMenuService(repo)
	h := menuHandler.NewMenuHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	r.App.GET("/api/menus/active", mdw.AuthMiddleware(), h.GetActiveMenus)
	r.App.GET("/api/menus/me", mdw.AuthMiddleware(), h.GetUserMenus)
	r.App.GET("/api/menus", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin), h.GetAll)

	menu := r.App.Group("/api/menu").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin))
	{
		menu.POST("", h.Create)
		menu.GET("/:id", h.GetByID)
		menu.PUT("/:id", h.Update)
		menu.DELETE("/:id", h.Delete)
	}
}

func (r *Routes) SessionRoutes() {
	redisClient := database.GetRedisClient()
	if redisClient == nil {
		logger.WriteLog(logger.LogLevelDebug, "Redis not available, session routes will not be registered")
		return
	}

	repo := sessionRepo.NewSessionRepository(redisClient)
	svc := sessionSvc.NewSessionService(repo)
	h := sessionHandler.NewSessionHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	sessionGroup := r.App.Group("/api/user").Use(mdw.AuthMiddleware())
	{
		sessionGroup.GET("/sessions", h.GetActiveSessions)
		sessionGroup.DELETE("/session/:session_id", h.RevokeSession)
		sessionGroup.POST("/sessions/revoke-others", h.RevokeAllOtherSessions)
	}

	logger.WriteLog(logger.LogLevelInfo, "Session management routes registered")
}

func (r *Routes) LocationRoutes() {
	svc := locationSvc.NewLocationService()
	h := locationHandler.NewLocationHandler(svc)

	location := r.App.Group("/api")
	{
		location.GET("/province", h.GetProvince)
		location.GET("/city", h.GetCity)
		location.GET("district", h.GetDistrict)
	}
}

func (r *Routes) VendorRoutes() {
	// Initialize storage provider (MinIO or R2) from infrastructure
	storageProvider, err := media.InitStorage()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, "Failed to initialize storage provider: "+err.Error())
		panic("Failed to initialize storage provider: " + err.Error())
	}

	repo := vendorRepo.NewVendorRepo(r.DB)
	svc := vendorSvc.NewVendorService(repo, storageProvider)
	h := vendorHandler.NewVendorHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	vendor := r.App.Group("/api/vendor").Use(mdw.AuthMiddleware())
	{
		vendor.GET("/profile", mdw.RoleMiddleware(utils.RoleVendor), h.GetVendorProfile)
		vendor.POST("/profile", mdw.RoleMiddleware(utils.RoleVendor), h.CreateOrUpdateVendorProfile)
		vendor.POST("/profile/:profileId/files", mdw.RoleMiddleware(utils.RoleVendor), h.UploadVendorProfileFile)
		vendor.DELETE("/profile/:profileId/files/:fileId", mdw.RoleMiddleware(utils.RoleVendor), h.DeleteVendorProfileFile)
	}

	vendorAdmin := r.App.Group("/api/vendors").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleClient))
	{
		vendorAdmin.GET("", h.GetAllVendors)
		vendorAdmin.GET("/:id", h.GetVendorDetail)
		vendorAdmin.PUT("/:id/status", h.UpdateVendorStatus)
		vendorAdmin.PUT("/files/:fileId/status", h.UpdateVendorProfileFileStatus)
		vendorAdmin.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin), h.DeleteVendor)
	}
}

func (r *Routes) EventRoutes() {
	// Initialize storage provider (MinIO or R2) from infrastructure
	storageProvider, err := media.InitStorage()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, "Failed to initialize storage provider: "+err.Error())
		panic("Failed to initialize storage provider: " + err.Error())
	}

	vRepo := vendorRepo.NewVendorRepo(r.DB)
	eRepo := eventRepo.NewEventRepo(r.DB)
	svc := eventSvc.NewEventService(eRepo, vRepo, storageProvider)
	h := eventHandler.NewEventHandler(svc, vRepo)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	// Public event list (for vendors to see open events)
	r.App.GET("/api/events", mdw.AuthMiddleware(), h.GetAllEvents)
	r.App.GET("/api/event/:id", mdw.AuthMiddleware(), h.GetEventByID)

	// Client/Admin event management
	eventAdmin := r.App.Group("/api/event").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleClient))
	{
		eventAdmin.POST("", h.CreateEvent)
		eventAdmin.PUT("/:id", h.UpdateEvent)
		eventAdmin.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin), h.DeleteEvent)
		eventAdmin.POST("/:id/files", h.UploadEventFile)
		eventAdmin.DELETE("/:id/files/:fileId", h.DeleteEventFile)
		eventAdmin.GET("/:id/submissions", h.GetSubmissionsByEventID)
		eventAdmin.PUT("/submission/:id/score", h.ScoreSubmission)
		eventAdmin.PUT("/submission/:id/shortlist", h.ShortlistSubmission)
		eventAdmin.POST("/:id/winner", h.SelectWinner)
		eventAdmin.GET("/:id/result", h.GetEventResultForAdmin)
	}

	// Vendor submission routes
	vendorEvent := r.App.Group("/api/vendor/event").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleVendor))
	{
		vendorEvent.POST("/:id/submit", h.SubmitPitch)
		vendorEvent.GET("/submissions", h.GetMySubmissions)
		vendorEvent.GET("/:id/result", h.GetEventResult)
	}
}

func (r *Routes) PaymentRoutes() {
	// Initialize storage provider (MinIO or R2) from infrastructure
	storageProvider, err := media.InitStorage()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, "Failed to initialize storage provider: "+err.Error())
		panic("Failed to initialize storage provider: " + err.Error())
	}

	vRepo := vendorRepo.NewVendorRepo(r.DB)
	pRepo := paymentRepo.NewPaymentRepo(r.DB)
	svc := paymentSvc.NewPaymentService(pRepo, vRepo, storageProvider)
	h := paymentHandler.NewPaymentHandler(svc, vRepo)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	// Vendor can only view their payments
	r.App.GET("/api/vendor/payments", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleVendor), h.GetMyPayments)
	r.App.GET("/api/vendor/payment/:id", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleVendor), h.GetMyPaymentByID)

	// Admin payment management
	paymentAdmin := r.App.Group("/api/payment").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin))
	{
		paymentAdmin.POST("", h.CreatePayment)
		paymentAdmin.GET("/:id", h.GetPaymentByID)
		paymentAdmin.PUT("/:id", h.UpdatePayment)
		paymentAdmin.PUT("/:id/status", h.UpdatePaymentStatus)
		paymentAdmin.DELETE("/:id", h.DeletePayment)
		paymentAdmin.POST("/:id/files", h.UploadPaymentFile)
		paymentAdmin.DELETE("/:id/files/:file_id", h.DeletePaymentFile)
	}

	r.App.GET("/api/payments", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin), h.GetAllPayments)
}

func (r *Routes) EvaluationRoutes() {
	// Initialize storage provider (MinIO or R2) from infrastructure
	storageProvider, err := media.InitStorage()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, "Failed to initialize storage provider: "+err.Error())
		panic("Failed to initialize storage provider: " + err.Error())
	}

	vRepo := vendorRepo.NewVendorRepo(r.DB)
	eRepo := eventRepo.NewEventRepo(r.DB)
	evRepo := evaluationRepo.NewEvaluationRepo(r.DB)
	svc := evaluationSvc.NewEvaluationService(evRepo, eRepo, vRepo, storageProvider)
	h := evaluationHandler.NewEvaluationHandler(svc, vRepo)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	// View evaluations (shared access)
	r.App.GET("/api/evaluations", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleClient, utils.RoleVendor), h.GetAllEvaluations)
	r.App.GET("/api/evaluation/:id", mdw.AuthMiddleware(), h.GetEvaluationByID)
	r.App.GET("/api/event/:id/evaluations", mdw.AuthMiddleware(), h.GetEvaluationsByEventID)

	// Vendor can view their own evaluations
	r.App.GET("/api/vendor/evaluations", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleVendor), h.GetMyEvaluations)

	// Vendor can upload photos for their evaluations
	r.App.POST("/api/evaluation/:id/photo", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleVendor), h.UploadPhoto)

	// Client creates evaluation for winner vendor
	evalClient := r.App.Group("/api/evaluation").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleClient))
	{
		evalClient.POST("", h.CreateEvaluation)
		evalClient.PUT("/:id", h.UpdateEvaluation)
		evalClient.PUT("/photo/:id/review", h.ReviewPhoto)
	}

	// Admin can delete evaluation and photos
	evalAdmin := r.App.Group("/api/evaluation").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin))
	{
		evalAdmin.DELETE("/:id", h.DeleteEvaluation)
		evalAdmin.DELETE("/photo/:id", h.DeletePhoto)
	}
}
