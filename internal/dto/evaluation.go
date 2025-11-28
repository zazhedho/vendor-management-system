package dto

type CreateEvaluationRequest struct {
	EventID       string   `json:"event_id" binding:"required,uuid"`
	VendorID      string   `json:"vendor_id" binding:"required,uuid"`
	OverallRating float64  `json:"overall_rating" binding:"omitempty,min=0,max=5"`
	Comments      string   `json:"comments" binding:"omitempty"`
	PhotoPaths    []string `json:"photo_paths" binding:"omitempty,max=5,dive,max=500"`
}

type UpdateEvaluationRequest struct {
	OverallRating float64 `json:"overall_rating" binding:"omitempty,min=0,max=5"`
	Comments      string  `json:"comments" binding:"omitempty"`
}

type UploadPhotoRequest struct {
	PhotoPath string `json:"photo_path" binding:"required,max=500"`
}

type ReviewPhotoRequest struct {
	Review string  `json:"review" binding:"omitempty"`
	Rating float64 `json:"rating" binding:"required,min=0,max=5"`
}
