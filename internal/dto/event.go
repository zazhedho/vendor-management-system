package dto

type CreateEventRequest struct {
	Title         string `json:"title" binding:"required,min=3,max=255"`
	Description   string `json:"description" binding:"omitempty"`
	Category      string `json:"category" binding:"omitempty,max=100"`
	StartDate     string `json:"start_date" binding:"omitempty"`
	EndDate       string `json:"end_date" binding:"omitempty"`
	TermsFilePath string `json:"terms_file_path" binding:"omitempty,max=500"`
}

type UpdateEventRequest struct {
	Title         string `json:"title" binding:"omitempty,min=3,max=255"`
	Description   string `json:"description" binding:"omitempty"`
	Category      string `json:"category" binding:"omitempty,max=100"`
	StartDate     string `json:"start_date" binding:"omitempty"`
	EndDate       string `json:"end_date" binding:"omitempty"`
	TermsFilePath string `json:"terms_file_path" binding:"omitempty,max=500"`
	Status        string `json:"status" binding:"omitempty,oneof=draft open closed completed cancelled"`
}

type SubmitPitchRequest struct {
	PitchFilePath       string `json:"pitch_file_path" binding:"required,max=500"`
	ProposalDetails     string `json:"proposal_details" binding:"omitempty"`
	AdditionalMaterials string `json:"additional_materials" binding:"omitempty"`
}

type ScoreSubmissionRequest struct {
	Score    float64 `json:"score" binding:"required,min=0,max=100"`
	Comments string  `json:"comments" binding:"omitempty"`
}

type ShortlistSubmissionRequest struct {
	IsShortlisted bool `json:"is_shortlisted"`
}

type SelectWinnerRequest struct {
	SubmissionID string `json:"submission_id" binding:"required,uuid"`
}
