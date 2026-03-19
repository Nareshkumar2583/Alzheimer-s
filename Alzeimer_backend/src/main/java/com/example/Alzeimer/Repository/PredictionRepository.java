package com.example.Alzeimer.Repository;

import com.example.Alzeimer.model.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByZone(String zone);
}