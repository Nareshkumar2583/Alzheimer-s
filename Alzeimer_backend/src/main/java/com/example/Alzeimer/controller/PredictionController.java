package com.example.Alzeimer.controller;

import com.example.Alzeimer.Repository.PredictionRepository;
import com.example.Alzeimer.Service.PredictionService;
import com.example.Alzeimer.model.GameInput;
import com.example.Alzeimer.model.Prediction;
import com.example.Alzeimer.model.PredictionResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class PredictionController {


    PredictionRepository repository;
    private PredictionService service;
    public PredictionController(PredictionService service) {
        this.service = service;
    }


    @PostMapping("/predict")
    public PredictionResponse predict(@RequestBody GameInput input) {
        return service.getPrediction(input);
    }
    @GetMapping("/history")
    public List<Prediction> getHistory() {
        return service.getAllPredictions();
    }
    @GetMapping("/zone/{zone}")
    public List<Prediction> getByZone(@PathVariable String zone) {
        return service.getByZone(zone);
    }
    @GetMapping("/count")
    public long count() {
        return repository.count();
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}