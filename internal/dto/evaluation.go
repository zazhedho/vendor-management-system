package dto

// CreateEvaluationRequest - Vendor creates evaluation after winning and completing event
type CreateEvaluationRequest struct {
	EventID  string `json:"event_id" binding:"required,uuid"`
	Comments string `json:"comments" binding:"omitempty,max=200"`
}

type UpdateEvaluationRequest struct {
	Comments string `json:"comments" binding:"omitempty,max=200"`
}

// UpdateDriveUrlRequest - Vendor updates Google Drive link
type UpdateDriveUrlRequest struct {
	GoogleDriveUrl string `json:"google_drive_url" binding:"omitempty,url,max=500"`
}

// UploadEvaluationPhotoRequest - Vendor uploads photo with caption only
type UploadEvaluationPhotoRequest struct {
	Caption string `json:"caption" binding:"omitempty,max=100"`
}

// ReviewEvaluationPhotoRequest - Client reviews and rates a photo (1-5 stars)
type ReviewEvaluationPhotoRequest struct {
	Review string `json:"review" binding:"omitempty,max=250"`
	Rating int    `json:"rating" binding:"required,min=1,max=5"`
}
