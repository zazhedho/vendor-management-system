package dto

type CreateEvaluationRequest struct {
	EventID       string  `json:"event_id" binding:"required,uuid"`
	VendorID      string  `json:"vendor_id" binding:"required,uuid"`
	OverallRating float64 `json:"overall_rating" binding:"omitempty,min=0,max=5"`
	Comments      string  `json:"comments" binding:"omitempty"`
}

type UpdateEvaluationRequest struct {
	OverallRating float64 `json:"overall_rating" binding:"omitempty,min=0,max=5"`
	Comments      string  `json:"comments" binding:"omitempty"`
}

// For photo uploads - separate from evaluation creation
type UploadEvaluationPhotoRequest struct {
	Review string  `json:"review" binding:"omitempty"`
	Rating float64 `json:"rating" binding:"omitempty,min=0,max=5"`
}

type UpdateEvaluationPhotoRequest struct {
	Review string  `json:"review" binding:"omitempty"`
	Rating float64 `json:"rating" binding:"omitempty,min=0,max=5"`
}
