package com.example.Alzeimer.Service;

import com.example.Alzeimer.Repository.PredictionRepository;
import com.example.Alzeimer.model.GameInput;
import com.example.Alzeimer.model.Prediction;
import com.example.Alzeimer.model.PredictionResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PredictionService {

    @Autowired
    private PredictionRepository repository;

    private final String FASTAPI_URL = "http://127.0.0.1:8000/predict";

    public PredictionResponse getPrediction(GameInput input) {

        RestTemplate restTemplate = new RestTemplate();

        // 🔥 Call FastAPI
        PredictionResponse response =
                restTemplate.postForObject(FASTAPI_URL, input, PredictionResponse.class);

        // 🔥 Save to DB
        Prediction p = new Prediction();

        p.setAge(input.AGE);
        p.setApoe4(input.APOE4);
        p.setAccuracy(input.accuracy);
        p.setMistakes(input.mistakes);
        p.setMaxMistakes(input.max_mistakes);
        p.setTimeTaken(input.time_taken);
        p.setMaxTime(input.max_time);
        p.setLearningScore(input.learning_score);
        p.setMaxLearning(input.max_learning);

        p.setMmse(response.mmse);
        p.setZone(response.zone);
        p.setConfidence(response.confidence);
        p.setBand(response.band);

        p.setCreatedAt(LocalDateTime.now());

        repository.save(p);

        return response;
    }
    public List<Prediction> getAllPredictions() {
        return repository.findAll();
    }
    public List<Prediction> getByZone(String zone) {
        return repository.findByZone(zone);
    }
}